import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Upload, Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { HexagramCanvas } from './HexagramCanvas';

interface ProcessedImage {
  originalUrl: string;
  hexagramData: (number | null)[][]; // null represents empty space
  gridSize: number;
}

export function HexagramGenerator() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [gridSize, setGridSize] = useState([32]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const processImage = useCallback(async () => {
    if (!uploadedImage) return;

    setIsProcessing(true);
    
    try {
      // Create an image element to get pixel data
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to grid dimensions
        const size = gridSize[0];
        canvas.width = size;
        canvas.height = size;

        // Draw and scale the image to fit the grid
        ctx.drawImage(img, 0, 0, size, size);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        // Convert to grayscale and analyze local contrast
        const grayscaleData: number[][] = [];
        const contrastData: number[][] = [];
        
        // First pass: convert to grayscale
        for (let y = 0; y < size; y++) {
          const row: number[] = [];
          for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Convert to grayscale using luminance formula
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            row.push(gray);
          }
          grayscaleData.push(row);
        }

        // Second pass: calculate local contrast for better structure preservation
        for (let y = 0; y < size; y++) {
          const row: number[] = [];
          for (let x = 0; x < size; x++) {
            const current = grayscaleData[y][x];
            let totalDiff = 0;
            let neighbors = 0;

            // Check 3x3 neighborhood for contrast calculation
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < size && nx >= 0 && nx < size && !(dx === 0 && dy === 0)) {
                  totalDiff += Math.abs(current - grayscaleData[ny][nx]);
                  neighbors++;
                }
              }
            }

            const avgContrast = neighbors > 0 ? totalDiff / neighbors : 0;
            row.push(avgContrast);
          }
          contrastData.push(row);
        }

        // Third pass: map to hexagrams with enhanced structure preservation
        const hexagramData: (number | null)[][] = [];
        const whiteThreshold = 240; // Threshold for considering a pixel "white/blank"
        const lowContrastThreshold = 15; // Threshold for low contrast areas

        for (let y = 0; y < size; y++) {
          const row: (number | null)[] = [];
          for (let x = 0; x < size; x++) {
            const gray = grayscaleData[y][x];
            const contrast = contrastData[y][x];
            
            // Use empty space for white/blank regions or very low contrast areas
            if (gray >= whiteThreshold || contrast < lowContrastThreshold) {
              row.push(null);
            } else {
              // Enhanced mapping that considers both brightness and local contrast
              // Adjust the grayscale value based on local contrast to preserve structure
              const contrastWeight = Math.min(contrast / 50, 1); // Normalize contrast influence
              const adjustedGray = gray * (0.7 + 0.3 * contrastWeight);
              
              // Map adjusted grayscale (0-255) to hexagram index (0-63)
              // Use a non-linear mapping to better preserve dark/light distinctions
              const normalizedGray = Math.min(adjustedGray / 255, 1);
              const hexagramIndex = Math.floor(Math.pow(normalizedGray, 0.8) * 63);
              row.push(hexagramIndex);
            }
          }
          hexagramData.push(row);
        }

        setProcessedImage({
          originalUrl: uploadedImage,
          hexagramData,
          gridSize: size
        });
        setIsProcessing(false);
      };
      img.src = uploadedImage;
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
      setIsProcessing(false);
    }
  }, [uploadedImage, gridSize]);

  const downloadPNG = useCallback(() => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'hexagram-art.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
    toast.success('PNG downloaded successfully');
  }, []);

  const downloadSVG = useCallback(() => {
    if (!processedImage) return;

    const { hexagramData, gridSize } = processedImage;
    // Increase SVG resolution significantly for better quality
    const svgSize = Math.max(1600, gridSize * 8); // Minimum 1600px, or 8px per hexagram cell
    const cellSize = svgSize / gridSize;
    
    let svgContent = `<svg width="${svgSize}" height="${svgSize}" xmlns="http://www.w3.org/2000/svg">`;
    svgContent += `<rect width="${svgSize}" height="${svgSize}" fill="white"/>`;
    
    // I Ching hexagram patterns (simplified representation using lines)
    const hexagramPatterns = generateHexagramPatterns();
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const hexagramIndex = hexagramData[y][x];
        
        // Skip empty spaces (null values)
        if (hexagramIndex === null) continue;
        
        const pattern = hexagramPatterns[hexagramIndex];
        const xPos = x * cellSize;
        const yPos = y * cellSize;
        
        // Enhanced hexagram rendering with better proportions and spacing
        const lineHeight = cellSize / 8; // Thinner lines for better detail
        const lineWidth = cellSize * 0.85; // Slightly wider lines
        const gapWidth = cellSize * 0.15; // Consistent gap for broken lines
        const margin = cellSize * 0.075; // Small margin around hexagram
        
        // Draw hexagram pattern with improved quality
        pattern.forEach((line, lineIndex) => {
          const lineY = yPos + margin + (lineIndex * lineHeight) + lineHeight / 2;
          const strokeWidth = Math.max(1, cellSize / 32); // Minimum 1px stroke, scales with size
          
          if (line === 1) {
            // Solid line (yang) - single rectangle with rounded ends
            svgContent += `<rect x="${xPos + margin}" y="${lineY - strokeWidth/2}" width="${lineWidth}" height="${strokeWidth}" fill="black" rx="${strokeWidth/4}"/>`;
          } else {
            // Broken line (yin) - two segments with gap
            const segmentWidth = (lineWidth - gapWidth) / 2;
            svgContent += `<rect x="${xPos + margin}" y="${lineY - strokeWidth/2}" width="${segmentWidth}" height="${strokeWidth}" fill="black" rx="${strokeWidth/4}"/>`;
            svgContent += `<rect x="${xPos + margin + segmentWidth + gapWidth}" y="${lineY - strokeWidth/2}" width="${segmentWidth}" height="${strokeWidth}" fill="black" rx="${strokeWidth/4}"/>`;
          }
        });
      }
    }
    
    svgContent += `</svg>`;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'hexagram-art.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('SVG downloaded successfully');
  }, [processedImage]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Upload Section */}
      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Your Image
          </CardTitle>
          <CardDescription>
            Choose an image to transform into hexagram art. Supported formats: JPG, PNG, GIF, WebP
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="lg"
            className="w-full max-w-xs"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Choose Image
          </Button>
        </CardContent>
      </Card>

      {/* Controls Section */}
      {uploadedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Grid Settings</CardTitle>
            <CardDescription>
              Adjust the grid size to control the detail level of your hexagram art. Higher values preserve more structure and enable ultra-high resolution output.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="grid-size">
                Grid Size: {gridSize[0]} × {gridSize[0]} (up to {gridSize[0] * gridSize[0]} hexagrams)
              </Label>
              <Slider
                id="grid-size"
                min={16}
                max={256}
                step={8}
                value={gridSize}
                onValueChange={setGridSize}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Lower detail (16×16)</span>
                <span>Ultra-high resolution (256×256)</span>
              </div>
              {gridSize[0] > 128 && (
                <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                  <strong>High Resolution Mode:</strong> Processing may take longer for grid sizes above 128×128. The result will be extremely detailed with sharp hexagram rendering.
                </div>
              )}
            </div>
            
            <Button 
              onClick={processImage} 
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Generate Hexagram Art'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview Section */}
      {(uploadedImage || processedImage) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Original Image */}
          {uploadedImage && (
            <Card>
              <CardHeader>
                <CardTitle>Original Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={uploadedImage}
                    alt="Original"
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Hexagram Art */}
          {processedImage && (
            <Card>
              <CardHeader>
                <CardTitle>Hexagram Art</CardTitle>
                <CardDescription>
                  Your image transformed using I Ching hexagrams with enhanced structure preservation and high-resolution rendering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-square bg-background rounded-lg overflow-hidden border">
                  <HexagramCanvas
                    ref={canvasRef}
                    hexagramData={processedImage.hexagramData}
                    gridSize={processedImage.gridSize}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={downloadPNG} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                  <Button onClick={downloadSVG} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download SVG
                  </Button>
                </div>
                
                {processedImage.gridSize > 128 && (
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded text-center">
                    High-resolution mode: Exports will be ultra-sharp and suitable for large format printing
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Generate simplified hexagram patterns for SVG export
function generateHexagramPatterns(): number[][] {
  const patterns: number[][] = [];
  
  // Generate all 64 hexagram patterns
  for (let i = 0; i < 64; i++) {
    const pattern: number[] = [];
    let binary = i.toString(2).padStart(6, '0');
    
    // Convert binary to hexagram lines (1 = solid, 0 = broken)
    for (let j = 0; j < 6; j++) {
      pattern.push(parseInt(binary[j]));
    }
    patterns.push(pattern);
  }
  
  return patterns;
}
