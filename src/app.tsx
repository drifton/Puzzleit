import * as React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/assets/style.css';

const App: React.FC = () => {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [gridSize, setGridSize] = React.useState(2);
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const gridSpacing = 10;
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Invalid file type. Please upload a .png, .jpeg, or .jpg file.');
      return;
    }

    setErrorMessage(null);
    const img = new Image();
    img.onload = () => setImage(img);
    const url = URL.createObjectURL(file);
    img.src = url;
    setImagePreview(url);
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !allowedTypes.includes(file.type)) {
      setErrorMessage('Invalid file type. Please upload a .png, .jpeg, or .jpg file.');
      return;
    }

    setErrorMessage(null);
    const img = new Image();
    img.onload = () => setImage(img);
    const url = URL.createObjectURL(file);
    img.src = url;
    setImagePreview(url);
  };

  const handleDragAreaClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const createPuzzle = async () => {
    if (!image) return;
    setLoading(true);
    setProgress(0);

    const rows = gridSize;
    const cols = gridSize;
    const pw = image.width / cols;
    const ph = image.height / rows;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = pw;
    canvas.height = ph;

    const pieceData: any[] = [];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.clearRect(0, 0, pw, ph);
        ctx.drawImage(image, x * pw, y * ph, pw, ph, 0, 0, pw, ph);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        pieceData.push({ x, y, dataUrl });
      }
    }

    shuffleArray(pieceData);

    const totalPieces = pieceData.length;
    for (let i = 0; i < totalPieces; i++) {
      const piece = pieceData[i];
      const widget = await miro.board.createImage({
        url: piece.dataUrl,
        x: (i % cols) * (pw + gridSpacing),
        y: Math.floor(i / cols) * (ph + gridSpacing),
        width: pw,
      });

      await widget.setMetadata('puzzle', {
        correctX: piece.x,
        correctY: piece.y,
        gridSize,
      });

      setProgress(i + 1);
    }

    setLoading(false);
    setProgress(0);
    removeImage();
  };

  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  return (
    <>
      <div className="grid wrapper" style={{ paddingBottom: '100px' }}>
        <div className="cs1 ce12">
          <p>Select a puzzle size, upload an image, and create the puzzle!</p>
          <h2>Select Puzzle Size</h2>
          <div>
            {[2, 3, 4, 5].map((size) => (
              <button
                key={size}
                className={`button ${gridSize === size ? 'button-primary' : ''}`}
                onClick={() => setGridSize(size)}
                style={{ marginRight: 8 }}
              >
                {size} x {size}
              </button>
            ))}
          </div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Upload an Image
            <div className="custom-tooltip-trigger">
              <span className="icon icon-info" />
              <div className="custom-tooltip-content" role="tooltip">
                PNG, JPEG
                <div className="custom-tooltip-arrow" />
              </div>
            </div>
          </h2>
          <div
            className="image-drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleImageDrop}
            onClick={handleDragAreaClick}
            style={{
              border: '2px dashed #aaa',
              padding: '1rem',
              textAlign: 'center',
              marginBottom: '1rem',
              cursor: 'pointer',
            }}
          >
            <p>Drag and drop an image here, or click to select one</p>
          </div>
          <input
            type="file"
            accept=".png, .jpeg, .jpg"
            onChange={handleImageUpload}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          {errorMessage && (
            <p style={{ color: 'red', fontSize: '14px', marginTop: '8px' }}>{errorMessage}</p>
          )}
          {imagePreview && (
            <>
              <h2>Preview</h2>
              <img
                src={imagePreview}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '300px', marginBottom: '0.5rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '8px' }}>
                <button
                  className="button button-danger"
                  type="button"
                  aria-label="Remove image"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  style={{ cursor: 'pointer' }}  // Add cursor style here for pointer effect
                >
                  <span 
                  className="icon icon-trash" 
                  style={{ cursor: 'pointer' }}  // Add cursor style directly to the icon
                  />
                </button>
              </div>
            </>
          )}
          {imagePreview && (
            <>
              <h2 style={{ marginTop: '0px' }}>Create Puzzle</h2>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  className="button button-primary"
                  onClick={createPuzzle}
                  disabled={loading}
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Creating Puzzle...</span>
                      <div className="button-loading"/>
                    </div>
                  ) : (
                    'Create Puzzle'
                  )}
                </button>
              </div>
              {loading && (
                <div style={{ marginTop: '0.5rem', fontSize: '14px', color: '#666' }}>
                  Progress: {progress} / {gridSize * gridSize}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <footer
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          backgroundColor: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
          zIndex: 1000,
        }}
      >
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => window.open('https://miro.com/marketplace/puzzleit/', '_blank')}
            className="icon-button"
            title="More Info"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span className="icon icon-info" />
          </button>
          <button
            onClick={() => window.open('https://github.com/drifton/Puzzleit/issues', '_blank')}
            className="icon-button"
            title="Comment-Feedback"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span className="icon icon-comment-feedback" />
          </button>
        </div>
        {process.env.NODE_ENV !== 'production' && (
          <div style={{ fontSize: '12px', color: '#777' }}>
            @{' '}
            <a
              href="https://linkedin.com/in/driton-christensen"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4262ff', textDecoration: 'none' }}
            >
              Driton Christensen
            </a>
          </div>
        )}
      </footer>
    </>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);