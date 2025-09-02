// Parallax scroll effect
export const initParallax = () => {
  const parallaxElements = document.querySelectorAll('.parallax-element');
  
  const handleScroll = () => {
    const scrollTop = window.pageYOffset;
    
    parallaxElements.forEach(element => {
      const speed = element.dataset.speed || 0.5;
      const yPos = -(scrollTop * speed);
      element.style.transform = `translateY(${yPos}px)`;
    });
  };
  
  window.addEventListener('scroll', handleScroll);
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
};