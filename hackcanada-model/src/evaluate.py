"""Evaluate trained model on test set."""
import torch
import torch.nn as nn
from pathlib import Path
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import logging
from train import SofaDataset, build_dataloaders_from_csv, SofaImageTransforms, ModelTrainer
from config import CLASSES, CLASS_TO_IDX, BATCH_SIZE, MODELS_DIR

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def evaluate_model(eval_set="all"):
    """Load best model and evaluate on test/val/all sets."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    # Find latest model
    model_files = list(MODELS_DIR.glob("best_model_*.pth"))
    if not model_files:
        logger.error("No model found in models/ directory")
        return
    
    best_model_path = sorted(model_files)[-1]
    logger.info(f"Loading model: {best_model_path}")
    
    # Rebuild model architecture and load weights
    trainer = ModelTrainer(device=device)
    model = trainer.build_model()
    state_dict = torch.load(best_model_path, map_location=device)
    model.load_state_dict(state_dict)
    model.eval()
    
    # Get data
    csv_path = Path("../data/sofa_returns_dataset.csv")
    if not csv_path.exists():
        csv_path = Path("data/sofa_returns_dataset.csv")
    
    logger.info(f"Loading data from: {csv_path}")
    from sklearn.model_selection import train_test_split
    import pandas as pd
    
    df = pd.read_csv(csv_path)
    raw_dir = Path(csv_path).parent / "raw"
    
    image_paths = []
    labels = []
    for _, row in df.iterrows():
        cls = row["condition_class"]
        img_path = raw_dir / cls / row["image_filename"]
        if img_path.exists():
            image_paths.append(img_path)
            labels.append(CLASS_TO_IDX[cls])
    
    # Split data
    X_train, X_temp, y_train, y_temp = train_test_split(
        image_paths, labels, test_size=0.30, random_state=42, stratify=labels
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )
    
    # Select dataset to evaluate
    if eval_set == "test":
        eval_paths, eval_labels = X_test, y_test
        set_name = "Test"
    elif eval_set == "val":
        eval_paths, eval_labels = X_val, y_val
        set_name = "Validation"
    elif eval_set == "train":
        eval_paths, eval_labels = X_train, y_train
        set_name = "Train"
    else:  # all
        eval_paths = image_paths
        eval_labels = labels
        set_name = "All Data"
    
    eval_dataset = SofaDataset(
        eval_paths, eval_labels, transforms=SofaImageTransforms.get_val_transforms()
    )
    eval_loader = torch.utils.data.DataLoader(
        eval_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2
    )
    
    logger.info(f"\n{set_name} set size: {len(eval_dataset)}")
    
    # Evaluate
    all_preds = []
    all_labels = []
    correct = 0
    total = 0
    
    with torch.no_grad():
        for images, target, _ in eval_loader:
            images = images.to(device)
            target = target.to(device)
            
            outputs = model(images)
            _, predicted = torch.max(outputs, 1)
            
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(target.cpu().numpy())
            
            correct += (predicted == target).sum().item()
            total += target.size(0)
    
    accuracy = correct / total
    logger.info(f"\n{'='*50}")
    logger.info(f"{set_name} Accuracy: {accuracy*100:.2f}% ({correct}/{total})")
    logger.info(f"{'='*50}\n")
    
    # Detailed report
    logger.info("Classification Report:")
    print(classification_report(all_labels, all_preds, target_names=CLASSES))
    
    logger.info("\nConfusion Matrix:")
    cm = confusion_matrix(all_labels, all_preds)
    print(cm)
    
    return accuracy

if __name__ == "__main__":
    # Test on all data for accurate representation
    evaluate_model(eval_set="all")
