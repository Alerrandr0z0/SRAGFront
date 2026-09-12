export default interface ModalProps {
  openModal: boolean;
  message: string;
  handleModalClose: () => void;
  position: string;
}
