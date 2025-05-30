import React from 'react';
const Modal = ({ title, children, onClose }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl font-bold ml-4" aria-label="Cerrar">
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
      {children}
    </div>
  </div>
);
export default Modal;
