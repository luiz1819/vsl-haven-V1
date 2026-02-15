export type BuilderSectionType = "header" | "video" | "text" | "cta" | "footer" | "faq" | "features";

export interface BuilderSection {
  id: string; // unique
  type: BuilderSectionType;
  title?: string;
  
  // Content: Specific to the component type
  content: {
    // Header
    headline?: string;
    subheadline?: string;
    
    // Text
    text?: string;
    
    // Video
    videoId?: string;
    
    // CTA
    buttonText?: string;
    url?: string;
    
    [key: string]: any;
  };

  // Styles: Visual customization
  styles: {
    // Layout
    paddingTop?: number;
    paddingBottom?: number;
    backgroundColor?: string;
    textColor?: string;
    textAlign?: "left" | "center" | "right";
    
    // Typography (Header/Text)
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    
    // CTA Specific
    buttonColor?: string;
    buttonTextColor?: string;
    buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "solid" | "shiny" | "hero";
    buttonSize?: "default" | "sm" | "lg" | "icon" | "xl";
    fullWidth?: boolean;
    borderRadius?: "none" | "sm" | "md" | "lg" | "full";
    shadow?: "none" | "sm" | "md" | "lg" | "xl";
    animation?: "none" | "pulse" | "shake" | "bounce";
    
    // Behavior
    delay?: number; // seconds
    
    [key: string]: any;
  };
}

export interface BuilderConfig {
  sections: BuilderSection[];
  globalStyles?: {
    backgroundColor?: string;
    fontFamily?: string;
    pageWidth?: "boxed" | "full";
  };
}
