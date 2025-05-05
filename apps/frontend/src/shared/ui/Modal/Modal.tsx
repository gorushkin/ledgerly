import { ModalState } from "src/shared/lib/modalState";

type ModalProps = {
  children: React.ReactNode;
  // state: ModalState;
  isOpen?: boolean;
  onClose?: () => void;
};
export const Modal = (props: ModalProps) => {
  const { children, isOpen, onClose } = props;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded">
        {children}
        <button
          onClick={onClose}
          className="mt-4 bg-red-500 text-white p-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};
