import { useEffect } from 'react';

interface PageTitleProps {
  title: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title }) => {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return null; // This component doesn't render anything
};

export default PageTitle;
