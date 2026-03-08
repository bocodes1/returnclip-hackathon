# ReturnClip — Cloudinary React Project Context

This project was scaffolded following the `create-cloudinary-react` pattern.
Stack: React 19 + Vite 6 + TypeScript 5.7 + @cloudinary/react + @cloudinary/url-gen

## Cloudinary Configuration

- **Cloud name**: read from `VITE_CLOUDINARY_CLOUD_NAME` env var (`.env` file)
- **Upload preset**: read from `VITE_CLOUDINARY_UPLOAD_PRESET` env var
- **Singleton**: `cld` instance exported from `src/cloudinaryConfig.ts`

## How to construct Cloudinary image URLs

Always use the SDK — never build URL strings manually.

```typescript
import { cld } from './cloudinaryConfig';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { improve } from '@cloudinary/url-gen/actions/adjust';
import { quality, format } from '@cloudinary/url-gen/actions/delivery';
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality';
import { auto as autoFormat } from '@cloudinary/url-gen/qualifiers/format';

const img = cld.image('my-public-id')
  .resize(fill().width(800))
  .adjust(improve())
  .delivery(quality(autoQuality()))
  .delivery(format(autoFormat()));
```

## How to render images

Use `AdvancedImage` from `@cloudinary/react`, not `<img>`:

```tsx
import { AdvancedImage, lazyload, responsive, placeholder } from '@cloudinary/react';

<AdvancedImage
  cldImg={img}
  plugins={[lazyload(), responsive(), placeholder({ mode: 'blur' })]}
  alt="description"
/>
```

## How to render video

Use `AdvancedVideo` from `@cloudinary/react`, not `<video>`:

```tsx
import { AdvancedVideo, lazyload } from '@cloudinary/react';
import { buildReturnVideo } from './cloudinaryConfig';

const cldVid = buildReturnVideo('my-video-public-id');

<AdvancedVideo cldVid={cldVid} plugins={[lazyload()]} controls autoPlay />
```

## Upload Widget

The typed `UploadWidget.tsx` component uses `window.cloudinary.createUploadWidget`.
All types are declared in `src/types/index.ts` under `declare global { interface Window { cloudinary: ... } }`.

## Common pitfalls

- Do NOT use `cloudinary-core` — use `@cloudinary/url-gen` instead
- Do NOT build URL strings like `https://res.cloudinary.com/${cloud}/image/upload/q_auto/...`
- Do NOT import from `@cloudinary/transformation-builder-sdk` — `@cloudinary/url-gen` replaces it
- Always pass `cldImg` (not `src`) to `AdvancedImage`
- Always pass `cldVid` (not `src`) to `AdvancedVideo`
- Import paths: `@cloudinary/url-gen/actions/resize`, `@cloudinary/url-gen/actions/delivery`, etc.

## Project structure

```
web/
├── src/
│   ├── main.tsx                    # Entry point (React 19 createRoot)
│   ├── App.tsx                     # Root component, tab navigation
│   ├── cloudinaryConfig.ts         # cld instance + SDK helper functions
│   ├── types/
│   │   └── index.ts                # Shared interfaces + Cloudinary global types
│   └── components/
│       ├── ReturnMediaViewer.tsx   # AdvancedImage with transformations
│       ├── VideoDemo.tsx           # AdvancedVideo (Side Quest 2)
│       └── UploadWidget.tsx        # Typed Cloudinary Upload Widget
├── tsconfig.json                   # References tsconfig.app.json + tsconfig.node.json
├── tsconfig.app.json               # App code (strict mode)
├── tsconfig.node.json              # Vite config + ESLint config
├── vite.config.ts                  # Vite 6 config with /api proxy to backend:3001
└── eslint.config.ts                # ESLint 9 flat config with typescript-eslint
```

## Backend connection

The Vite dev server proxies `/api/*` to `http://localhost:3001` (the Node.js backend).
Set `VITE_BACKEND_URL` in `.env` for production deployments.
