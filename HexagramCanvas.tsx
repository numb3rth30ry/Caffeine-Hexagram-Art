import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface HexagramCanvasProps {
  hexagramData: (number | null)[][];
  gridSize: number;
}

export const HexagramCanvas = forwardRef<HTMLCanvasElement, HexagramCanvasProps>(
  ({ hexagramData, gridSize }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => canvasRef.current!, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Significantly increase canvas resolution for better quality
      // Scale based on grid size for optimal balance between quality and performance
      const baseSize = 800;
      const scaleFactor = Math.min(4, Math.max(1, 1024 / gridSize)); // Dynamic scaling
      const canvasSize = Math.floor(baseSize * scaleFactor);
      
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = false; // Keep crisp edges for hexagrams
      
      // Clear canvas with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      const cellSize = canvasSize / gridSize;
      const lineHeight = cellSize / 10; // Thinner lines for better detail at high resolution
      const lineWidth = cellSize * 0.85; // Slightly wider for better visibility
      const gapWidth = cellSize * 0.12; // Proportional gap for broken lines
      const margin = cellSize * 0.075; // Small margin around each hexagram

      ctx.fillStyle = 'black';
      ctx.strokeStyle = 'black';
      
      // Dynamic line width based on cell size for optimal rendering
      const strokeWidth = Math.max(1, Math.floor(cellSize / 20));

      // Draw hexagrams with enhanced quality
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const hexagramIndex = hexagramData[y][x];
          
          // Skip empty spaces (null values) - leave them white
          if (hexagramIndex === null) continue;
          
          const xPos = x * cellSize;
          const yPos = y * cellSize;

          // Convert hexagram index to 6-bit binary (representing the 6 lines)
          const binary = hexagramIndex.toString(2).padStart(6, '0');

          // Draw the 6 lines of the hexagram with improved rendering
          for (let line = 0; line < 6; line++) {
            const lineY = yPos + margin + (line * lineHeight) + lineHeight / 2;
            const isYang = binary[line] === '1'; // 1 = solid line (yang), 0 = broken line (yin)

            if (isYang) {
              // Draw solid line (yang) with rounded ends for better appearance
              ctx.beginPath();
              ctx.roundRect(
                xPos + margin,
                lineY - strokeWidth / 2,
                lineWidth,
                strokeWidth,
                strokeWidth / 4
              );
              ctx.fill();
            } else {
              // Draw broken line (yin) - two segments with gap in middle
              const segmentWidth = (lineWidth - gapWidth) / 2;
              
              // Left segment
              ctx.beginPath();
              ctx.roundRect(
                xPos + margin,
                lineY - strokeWidth / 2,
                segmentWidth,
                strokeWidth,
                strokeWidth / 4
              );
              ctx.fill();
              
              // Right segment
              ctx.beginPath();
              ctx.roundRect(
                xPos + margin + segmentWidth + gapWidth,
                lineY - strokeWidth / 2,
                segmentWidth,
                strokeWidth,
                strokeWidth / 4
              );
              ctx.fill();
            }
          }
        }
      }

      // Scale down the display while maintaining high internal resolution
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      
    }, [hexagramData, gridSize]);

    return (
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          imageRendering: 'crisp-edges',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
    );
  }
);

HexagramCanvas.displayName = 'HexagramCanvas';
