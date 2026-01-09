// Type for variant props - simplified version that works
export type VariantProps<T> = T extends (props: infer P) => any ? P : never

// Simple cva implementation as fallback for when the main package has issues
export function cva(
  base: string,
  options?: {
    variants?: Record<string, Record<string, string>>
    defaultVariants?: Record<string, string>
  }
) {
  return (props?: Record<string, any>) => {
    const classes = [base]
    
    if (options?.variants && props) {
      for (const [variantName, variantValues] of Object.entries(options.variants)) {
        const propValue = props[variantName]
        // First check if prop is provided, then fall back to default
        const value = propValue || (options.defaultVariants?.[variantName])
        if (value && variantValues[value]) {
          classes.push(variantValues[value])
        }
      }
    }
    
    if (props?.className) {
      classes.push(props.className)
    }
    
    return classes.join(" ")
  }
}