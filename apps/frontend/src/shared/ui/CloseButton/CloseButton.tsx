import { X } from 'lucide-react';

type CloseButtonProps = {
  onClick?: () => void;
};

export const CloseButton = ({ onClick }: CloseButtonProps) => {
  return (
    <button type="button" className="btn btn-ghost btn-square" onClick={onClick}>
      <X />
    </button>
  );
};
