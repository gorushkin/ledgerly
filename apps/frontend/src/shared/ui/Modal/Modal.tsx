import { createContext, useContext, type ReactNode } from 'react';

import clsx from 'clsx';
import { CloseButton } from 'src/shared/ui/CloseButton';

type MaxWidth =
  | 'max-w-sm'
  | 'max-w-md'
  | 'max-w-lg'
  | 'max-w-xl'
  | 'max-w-2xl'
  | 'max-w-3xl'
  | 'max-w-4xl'
  | 'max-w-5xl';

type ModalContext = {
  onClose: () => void | null;
};

const ModalContext = createContext<ModalContext | null>(null);

const useModalContext = () => {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }

  return context;
};

const ModalProvider = ({ children, onClose }: { children: ReactNode; onClose: () => void | null }) => {
  return <ModalContext.Provider value={{ onClose }}>{children}</ModalContext.Provider>;
};

type ModalHeaderProps = {
  children?: ReactNode;
  title?: string;
  withCloseButton?: boolean;
  className?: string;
};

const ModalHeader = (props: ModalHeaderProps) => {
  const { onClose } = useModalContext();
  const { children, className, title, withCloseButton } = props;

  if (!(title || children)) {
    throw new Error('ModalHeader requires either a title or children prop');
  }

  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      {title && <h3 className="text-lg font-medium">{title}</h3>}
      {children && <div className="flex-1">{children}</div>}
      {withCloseButton && <CloseButton onClick={onClose} />}
    </div>
  );
};

type ModalFooterProps = {
  children: ReactNode;
  className?: string;
};

const ModalFooter = (props: ModalFooterProps) => {
  const { children, className } = props;
  return <div className={clsx('modal-action flex justify-end gap-3', className)}>{children}</div>;
};

type ModalProps = {
  children: ReactNode;
  isOpen?: boolean;
  onClose: () => void;
  zIndex?: 'high' | 'low';
  maxWidth?: MaxWidth;
  className?: string;
};

const Modal = (props: ModalProps) => {
  const { children, className, isOpen, maxWidth = 'max-w-lg', onClose, zIndex } = props;

  if (!isOpen) {
    return null;
  }

  const getModalClass = () => {
    const baseClass = 'modal modal-open';
    if (zIndex === 'high') return `${baseClass} z-[1000]`;
    if (zIndex === 'low') return `${baseClass} z-[50]`;
    return baseClass;
  };

  // const getBackdropClass = () => {
  //   const baseClass = 'modal-backdrop';
  //   if (zIndex === 'high') return `${baseClass} z-[999]`;
  //   if (zIndex === 'low') return `${baseClass} z-[49]`;
  //   return baseClass;
  // };

  return (
    <ModalProvider onClose={onClose}>
      <div className={clsx(getModalClass(), 'text-black', className)}>
        <div className={clsx(`modal-box ${maxWidth}`)}>{children}</div>
        {/* <label className={getBackdropClass()} onClick={onClose} /> */}
      </div>
    </ModalProvider>
  );
};

const ModalBody = ({ children }: { children: ReactNode }) => {
  return <div className="space-y-4">{children}</div>;
};

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.displayName = 'Modal';
ModalHeader.displayName = 'ModalHeader';
ModalFooter.displayName = 'ModalFooter';

export { Modal, ModalHeader, ModalBody, ModalFooter };
