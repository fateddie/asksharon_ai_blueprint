// Minimal speech recognition types to avoid conflicts
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export {};