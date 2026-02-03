import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((type, message, duration = 4000) => {
        const id = Date.now().toString() + Math.random().toString();
        setNotifications((prev) => [...prev, { id, type, message }]);

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ addNotification, removeNotification }}>
            {children}
            <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
        </NotificationContext.Provider>
    );
};

const NotificationContainer = ({ notifications, removeNotification }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {notifications.map((notif) => (
                    <NotificationCard key={notif.id} {...notif} onClose={() => removeNotification(notif.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
};

const NotificationCard = ({ id, type, message, onClose }) => {
    const variants = {
        initial: { opacity: 0, x: 50, scale: 0.95 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: 50, scale: 0.95, transition: { duration: 0.2 } },
    };

    const styles = {
        success: { border: 'border-emerald-500', bg: 'bg-emerald-900/95', icon: <CheckCircle className="text-emerald-400 w-5 h-5" /> },
        error: { border: 'border-red-500', bg: 'bg-red-900/95', icon: <AlertCircle className="text-red-400 w-5 h-5" /> },
        warning: { border: 'border-amber-500', bg: 'bg-amber-900/95', icon: <AlertTriangle className="text-amber-400 w-5 h-5" /> },
        info: { border: 'border-blue-500', bg: 'bg-blue-900/95', icon: <Info className="text-blue-400 w-5 h-5" /> },
    };

    const style = styles[type] || styles.info;

    return (
        <motion.div
            layout
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`pointer-events-auto min-w-[320px] max-w-sm w-full p-4 rounded-xl border backdrop-blur-md shadow-lg ${style.bg} ${style.border} border-l-4`}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-white/90 leading-snug">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 text-white/40 hover:text-white/80 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};
