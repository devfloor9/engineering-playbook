import React from 'react';
import BackToTopButton from '@theme-original/BackToTopButton';

export default function MotionAwareBackToTopButton() {
  function handleClick(event) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Skip the library's JavaScript smooth-scroll loop for this preference.
      event.stopPropagation();
      window.scrollTo(0, 0);
    }
  }

  return <div onClickCapture={handleClick}><BackToTopButton /></div>;
}
