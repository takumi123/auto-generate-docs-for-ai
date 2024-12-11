# Auto Generate Docs for AI

A VSCode extension that automatically generates comprehensive documentation to help AI understand your codebase specifications with a single click.

## Features

- 🎯 **One-Click Documentation Generation**: Generate detailed documentation for your codebase with a simple button press
- 🌳 **Interactive File Tree**: Select specific files or directories for documentation
- 🔒 **Secure API Key Management**: Safely store and manage your OpenRouter API key
- 📝 **Comprehensive Documentation**: Generates detailed documentation covering:
  - System Level Architecture
  - Program Level Details
  - API/Database Design
  - Testing/Quality Control
  - Infrastructure Setup

## Requirements

- VSCode 1.89.1 or higher
- OpenRouter API Key (for accessing Gemini Pro 1.5)

## Installation

1. Install the extension from VSCode Marketplace
2. Configure your OpenRouter API key using the "Set OpenRouter API Key" command
3. Open the AI Docs Generator sidebar to start generating documentation

## Usage

1. Open the AI Docs Generator sidebar in VSCode
2. Configure your OpenRouter API key if not already set
3. Select the files you want to document using the interactive file tree
4. Click "Generate Documentation for Selected Files"
5. The generated documentation will be saved to `docs_for_ai/summary.md` by default


## Technical Details

- Uses OpenRouter API with Google's Gemini Pro 1.5 model
- Real-time progress tracking with animated status bar
- Secure API key storage using VSCode's built-in secrets storage
- File system watching for automatic tree updates
- Supports custom system prompts for specialized documentation needs

## Documentation Format

The generated documentation covers:

### System Level
- Processing flows and module responsibilities
- Implemented algorithms
- I/O specifications
- Exception handling mechanisms
- Data structures

### Program Level
- Function/method documentation
- Parameter and return value details
- Variable usage
- Constants and configuration files
- Function pre/post conditions

### API/Database Design
- Status codes
- Error response formats
- Database schemas
- Indexes and constraints
- Database relationships

### Testing/Quality Control
- Test cases
- Test data
- Coding standards
- Test coverage
- Edge cases

### Infrastructure
- System infrastructure
- Build process
- Deployment process
- Environment parameters
- Test environment setup

## License

This extension is licensed under the MIT License.
