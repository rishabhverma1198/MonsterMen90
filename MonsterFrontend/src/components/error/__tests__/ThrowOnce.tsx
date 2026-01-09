import React from 'react'

let shouldThrow = true

export class ThrowOnce extends React.Component<{ children?: React.ReactNode }> {
  constructor(props: {}) {
    super(props)
    if (shouldThrow) {
      shouldThrow = false
      throw new Error('Boom')
    }
  }

  render() {
    return <>{this.props.children}</>
  }
}

export const resetThrowOnce = () => {
  shouldThrow = true
}
