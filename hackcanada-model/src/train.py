"""
Training script for sofa condition classification using MobileNetV2.
Fine-tunes a pre-trained MobileNetV2 model on sofa images.
"""

import logging
from pathlib import Path
from datetime import datetime
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import models
from PIL import Image
import pandas as pd

from config import (
    CLASSES,
    CLASS_TO_IDX,
    BATCH_SIZE,
    NUM_EPOCHS,
    LEARNING_RATE,
    WEIGHT_DECAY,
    EARLY_STOPPING_PATIENCE,
    MODELS_DIR,
    PROCESSED_DATA_DIR,
    LOGS_DIR,
)
from utils import SofaImageTransforms, ImageLoader

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class SofaDataset(Dataset):
    """Custom dataset for sofa condition images."""

    def __init__(self, image_paths, labels, transforms=None):
        """
        Args:
            image_paths: list of Path objects to images
            labels: list of class labels (0, 1, 2)
            transforms: torchvision transforms to apply
        """
        self.image_paths = image_paths
        self.labels = labels
        self.transforms = transforms

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        label = self.labels[idx]

        # Load and transform image
        try:
            image = ImageLoader.load_image(img_path)
            if self.transforms:
                image = self.transforms(image)
        except Exception as e:
            logger.error(f"Error loading {img_path}: {e}")
            raise

        return image, label, str(img_path)


class ModelTrainer:
    """Train and evaluate sofa classification model."""

    def __init__(self, device="cpu"):
        self.device = device
        self.best_model_path = MODELS_DIR / f"best_model_{datetime.now():%Y%m%d_%H%M%S}.pth"
        self.best_val_acc = 0.0

    def build_model(self):
        """Build MobileNetV2 model fine-tuned for sofa classification."""
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)

        # Freeze early layers (transfer learning)
        for param in model.features[:12].parameters():
            param.requires_grad = False

        # Replace classifier
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, len(CLASSES)),
        )

        return model.to(self.device)

    def train_epoch(self, model, train_loader, criterion, optimizer):
        """Train for one epoch."""
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for images, labels, _ in train_loader:
            images = images.to(self.device)
            labels = labels.to(self.device)

            # Forward pass
            outputs = model(images)
            loss = criterion(outputs, labels)

            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            # Stats
            total_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            correct += (predicted == labels).sum().item()
            total += labels.size(0)

        avg_loss = total_loss / len(train_loader)
        acc = correct / total
        return avg_loss, acc

    def validate(self, model, val_loader, criterion):
        """Validate model."""
        model.eval()
        total_loss = 0.0
        correct = 0
        total = 0

        with torch.no_grad():
            for images, labels, _ in val_loader:
                images = images.to(self.device)
                labels = labels.to(self.device)

                outputs = model(images)
                loss = criterion(outputs, labels)

                total_loss += loss.item()
                _, predicted = torch.max(outputs, 1)
                correct += (predicted == labels).sum().item()
                total += labels.size(0)

        avg_loss = total_loss / len(val_loader)
        acc = correct / total
        return avg_loss, acc

    def train(self, train_loader, val_loader):
        """Full training loop."""
        model = self.build_model()
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.AdamW(
            model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY
        )
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode="max", factor=0.5, patience=3
        )

        patience_counter = 0

        logger.info(f"Starting training for {NUM_EPOCHS} epochs")
        logger.info(f"Model will be saved to: {self.best_model_path}")

        for epoch in range(NUM_EPOCHS):
            train_loss, train_acc = self.train_epoch(
                model, train_loader, criterion, optimizer
            )
            val_loss, val_acc = self.validate(model, val_loader, criterion)

            logger.info(
                f"Epoch {epoch+1}/{NUM_EPOCHS} | "
                f"Train Loss: {train_loss:.4f} Acc: {train_acc:.4f} | "
                f"Val Loss: {val_loss:.4f} Acc: {val_acc:.4f}"
            )

            # Save best model
            if val_acc > self.best_val_acc:
                self.best_val_acc = val_acc
                torch.save(model.state_dict(), self.best_model_path)
                logger.info(f"✓ Saved best model (Acc: {val_acc:.4f})")
                patience_counter = 0
            else:
                patience_counter += 1

            scheduler.step(val_acc)

            # Early stopping
            if patience_counter >= EARLY_STOPPING_PATIENCE:
                logger.info(
                    f"Early stopping triggered after {epoch+1} epochs"
                )
                break

        logger.info(f"Training complete. Best model: {self.best_model_path}")
        return model, self.best_model_path


def build_dataloaders_from_csv(csv_path):
    """Build train/val/test dataloaders from annotation CSV."""
    from sklearn.model_selection import train_test_split

    df = pd.read_csv(csv_path)

    # Map filenames to full paths
    raw_dir = Path(csv_path).parent / "raw"
    image_paths = []
    labels = []

    for _, row in df.iterrows():
        # Use condition_class from CSV to find image
        cls = row["condition_class"]
        img_path = raw_dir / cls / row["image_filename"]
        if img_path.exists():
            image_paths.append(img_path)
            labels.append(CLASS_TO_IDX[cls])

    logger.info(f"Found {len(image_paths)} images in dataset (looking in: {raw_dir})")

    # Stratified splits
    X_train, X_temp, y_train, y_temp = train_test_split(
        image_paths, labels, test_size=0.30, random_state=42, stratify=labels
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )

    # Create datasets
    train_dataset = SofaDataset(
        X_train, y_train, transforms=SofaImageTransforms.get_train_transforms()
    )
    val_dataset = SofaDataset(
        X_val, y_val, transforms=SofaImageTransforms.get_val_transforms()
    )
    test_dataset = SofaDataset(
        X_test, y_test, transforms=SofaImageTransforms.get_val_transforms()
    )

    train_loader = DataLoader(
        train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2
    )
    val_loader = DataLoader(
        val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2
    )
    test_loader = DataLoader(
        test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2
    )

    logger.info(
        f"Data split: "
        f"Train={len(train_dataset)}, "
        f"Val={len(val_dataset)}, "
        f"Test={len(test_dataset)}"
    )

    return train_loader, val_loader, test_loader


if __name__ == "__main__":
    # Example usage
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")

    # Build dataloaders from CSV
    # Try both relative paths
    csv_path = Path("../data/sofa_returns_dataset.csv")
    if not csv_path.exists():
        csv_path = Path("data/sofa_returns_dataset.csv")
    
    if csv_path.exists():
        logger.info(f"Loading data from: {csv_path.resolve()}")
        train_loader, val_loader, test_loader = build_dataloaders_from_csv(csv_path)

        # Train model
        trainer = ModelTrainer(device=device)
        model, best_path = trainer.train(train_loader, val_loader)
        logger.info(f"Best model saved to: {best_path}")
    else:
        logger.warning(f"CSV file not found at {csv_path}")
        logger.info("Please run annotation first.")
