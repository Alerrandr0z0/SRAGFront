import { useEffect, useState } from 'react';

const readDark = () => document.body.classList.contains('dark');

/** Acompanha a classe `dark` do <body> (alternada pelo useColorMode). */
export default function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(readDark);

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(readDark()));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
