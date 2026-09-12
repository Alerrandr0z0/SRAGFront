import { Button, Modal } from 'flowbite-react';
import type ModalProps from './ModalProps';

export function SuccessModal({ openModal, handleModalClose, message, position }: ModalProps) {
  return (
    <>
      <Modal
        show={openModal}
        position={position}
        size="md"
        onClose={() => handleModalClose()}
        className="md:ml-64 drop-shadow-xl"
      >
        <Modal.Body>
          <div className="text-center">
            <div className="flex justify-center">
              <svg
                className="w-15 h-15 text-green-500"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.793-1.793a1 1 0 0 0-1.414 1.414l2.5 2.5a1 1 0 0 0 1.414 0l4-4Z"
                  clipRule="evenodd"
                />
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
