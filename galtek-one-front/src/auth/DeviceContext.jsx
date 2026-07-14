import React, { createContext, useState, useEffect, useContext } from 'react';
import { endpoints } from '../API/api';

const DeviceContext = createContext();

export const useDevice = () => useContext(DeviceContext);

export const DeviceProvider = ({ children }) => {
  const [isActivated, setIsActivated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [deviceError, setDeviceError] = useState(false);
  const [machineCodeBase64, setMachineCodeBase64] = useState(null);
  const [lockReason, setLockReason] = useState(null);

  const checkDeviceStatus = async () => {
    setIsChecking(true);
    setDeviceError(false);
    try {
      const res = await fetch(endpoints.deviceIdentity);
      if (!res.ok) {
        throw new Error('Error al conectar con el servidor');
      }
      const data = await res.json();
      
      if (data.status === 'OK' && data.data) {
        if (data.data.machineCodeBase64) {
          // Bloqueado
          setIsActivated(false);
          setMachineCodeBase64(data.data.machineCodeBase64);
          setLockReason(data.data.lockReason);
        } else {
          // Activado
          setIsActivated(true);
          setMachineCodeBase64(null);
          setLockReason(null);
        }
      } else {
         throw new Error('Respuesta invalida del servidor');
      }
    } catch (error) {
      console.error('Error al comprobar identidad del dispositivo:', error);
      setDeviceError(true);
      setIsActivated(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkDeviceStatus();
  }, []);

  const activateDevice = async (token) => {
    try {
      const res = await fetch(endpoints.deviceActivate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      
      if (res.ok && data.status === 'OK') {
        setIsActivated(true);
        setMachineCodeBase64(null);
        setLockReason(null);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Error de activacion (Backend)' };
      }
    } catch (error) {
      return { success: false, message: 'Fallo de red al intentar activar' };
    }
  };

  return (
    <DeviceContext.Provider value={{ isActivated, isChecking, deviceError, machineCodeBase64, lockReason, activateDevice, checkDeviceStatus }}>
      {children}
    </DeviceContext.Provider>
  );
};
