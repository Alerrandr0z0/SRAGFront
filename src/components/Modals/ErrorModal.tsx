import { Button, Modal } from 'flowbite-react';
import type ModalProps from './ModalProps';

export function ErrorModal({ openModal, handleModalClose, message, position }: ModalProps) {
  return (
    <>
      <Modal show={openModal} position={position} size="md" onClose={() => handleModalClose()}>
        <Modal.Body>
          <div className="text-center">
            <div className="flex justify-center">
              <svg aria-hidden="true"
                className="w-15 h-15 text-red-700"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                fill="currentColor"
              >
                <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" />
              </svg>
            </div>
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">{message}</h3>
            <div className="flex justify-center gap-4">
              <Button className="bg-green-500 w-26" onClick={() => handleModalClose()}>
                Ok
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
