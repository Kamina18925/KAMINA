import React, { useEffect, useContext } from 'react';
import { AppContext } from '../App';

const Notification = ({ message, type, id }) => {
  const { dispatch } = useContext(AppContext);
  useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: 'HIDE_NOTIFICATION' }), 3500);
    return () => clearTimeout(timer);
  }, [id, dispatch]);
  if (!message) return null;
  return (
    <div className={`notification-popup ${type} show`}>
      <span className="font-semibold text-base mr-2">
        {type === 'success' && <i className="fas fa-check-circle mr-1"></i>}
        {type === 'error' && <i className="fas fa-exclamation-circle mr-1"></i>}
        {type === 'info' && <i className="fas fa-info-circle mr-1"></i>}
      </span>
      <span>{message}</span>
    </div>
  );
};
export default Notification;
