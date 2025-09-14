# Hexagram Art Generator

## Overview
A web application that converts uploaded images into artistic representations using I Ching hexagrams as visual elements in a grid pattern, with enhanced structure preservation and intelligent blank space handling.

## Core Features

### Image Upload
- Users can upload image files in common formats (JPG, PNG, etc.)
- Single image upload at a time

### Enhanced Hexagram Conversion
- Convert uploaded images to grayscale
- Map grayscale values to I Ching hexagrams to create a grid-based artistic representation with improved structure preservation
- Each hexagram acts as a "pixel" in the final output, better approximating the original image's shapes and contrasts
- For blank or near-white regions in the input image, use empty space (no hexagram) instead of rendering a hexagram to enhance clarity and structure
- Enhanced algorithm that better preserves the visual structure and contrast patterns of the original image

### Grid Size Control
- Provide a slider interface for adjusting grid size with significantly increased maximum resolution options
- Grid size determines the quality and detail level of the hexagram approximation
- Support for much higher resolution hexagram art output than previously available
- Live preview updates as users adjust the slider

### Preview Display
- Show real-time preview of the generated hexagram art with improved structure fidelity
- Preview updates immediately when grid size is adjusted
- Clear visualization of empty spaces for blank/white regions

### Export Functionality
- Allow users to download the generated hexagram art
- Support high-quality PNG format export with significantly improved hexagram image quality
- Support SVG format export for scalable vector output with enhanced hexagram detail
- Hexagram images in exports are sharp and easily discernible even at large sizes
- High-resolution hexagram rendering ensures clarity and detail preservation in final output

## Technical Requirements

### Frontend Processing
- All image processing and hexagram generation happens in the frontend
- Enhanced image analysis algorithms for better structure preservation
- Intelligent threshold detection for blank/white regions
- No backend storage of uploaded images or generated art
- Real-time preview rendering
- High-quality hexagram rendering system for sharp, detailed output at all sizes

### Backend Storage
- No persistent data storage required
- All processing is client-side only

## User Interface
- Simple, intuitive interface with image upload area
- Grid size slider with clear visual feedback and extended maximum resolution range
- Prominent preview area for generated art showing enhanced structure preservation
- Download buttons for different export formats
- Application content in English
