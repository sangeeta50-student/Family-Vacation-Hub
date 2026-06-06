type ModalProps = {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

function Modal({
  title,
  children,
  onClose,
}: ModalProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) =>
          e.stopPropagation()
        }
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "16px",
          minWidth: "500px",
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2>{title}</h2>

          <button
            onClick={onClose}
          >
            ✖
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default Modal;