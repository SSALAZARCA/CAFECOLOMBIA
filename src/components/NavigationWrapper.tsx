import React from 'react';
import Navigation from './Navigation';

interface NavigationWrapperProps {
  isOpen: boolean;
  onClose: () => void;
}

const NavigationWrapper: React.FC<NavigationWrapperProps> = ({ isOpen, onClose }) => {
  return <Navigation isOpen={isOpen} onClose={onClose} />;
};

export default NavigationWrapper;