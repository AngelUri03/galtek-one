import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "../auth/AuthContext";
import { CASH_STATUS } from "./cashSessionUtils";
import {
  fetchCashState,
  initializeCashBalance as initializeCashBalanceRequest,
  openCashSession as openCashSessionRequest,
} from "./cashSessionService";

const CashSessionContext = createContext(null);

const initialState = {
  station: null,
  cashSession: null,
  cashStatus: CASH_STATUS.LOADING,
  loading: false,
  opening: false,
  error: null,
  permissions: null,
  capabilities: {
    canViewBasicSummary: false,
    canViewSalesSummary: false,
    canViewExpectedBalance: false,
    canRevealExpectedBalance: false,
    canOpenCashControl: false,
    canCloseCurrentSession: false,
    canCloseOwnSession: false,
    canCloseOtherSession: false,
    canViewMovements: false,
    canViewHistory: false,
    canReviewIncidents: false,
  },
  balanceInitialized: false,
  currentBalance: null,
  policy: null,
  pendingIncidentCount: 0,
  requiresReconciliation: false,
  requiresReceivingCount: false,
  incomingCount: null,
  canCurrentUserClose: false,
  canCurrentUserResume: false,
  lastSyncAt: null,
  code: null,
  message: null,
};

function mapState(payload) {
  const capabilities = payload?.capabilities || {};
  return {
    station: payload?.station ?? null,
    cashSession: payload?.currentSession ?? null,
    cashStatus: payload?.status || CASH_STATUS.ERROR,
    error: payload?.status === CASH_STATUS.ERROR ? payload?.message || "No se pudo comprobar el turno de caja." : null,
    permissions: {
      canCurrentUserClose: Boolean(payload?.canCurrentUserClose),
      canCurrentUserResume: Boolean(payload?.canCurrentUserResume),
    },
    capabilities: {
      canViewBasicSummary: Boolean(capabilities?.canViewBasicSummary),
      canViewSalesSummary: Boolean(capabilities?.canViewSalesSummary),
      canViewExpectedBalance: Boolean(capabilities?.canViewExpectedBalance),
      canRevealExpectedBalance: Boolean(capabilities?.canRevealExpectedBalance),
      canOpenCashControl: Boolean(capabilities?.canOpenCashControl),
      canCloseCurrentSession: Boolean(capabilities?.canCloseCurrentSession),
      canCloseOwnSession: Boolean(capabilities?.canCloseOwnSession),
      canCloseOtherSession: Boolean(capabilities?.canCloseOtherSession),
      canViewMovements: Boolean(capabilities?.canViewMovements),
      canViewHistory: Boolean(capabilities?.canViewHistory),
      canReviewIncidents: Boolean(capabilities?.canReviewIncidents),
    },
    balanceInitialized: Boolean(payload?.balanceInitialized),
    currentBalance: payload?.currentBalance ?? null,
    policy: payload?.policy ?? null,
    pendingIncidentCount: Number(payload?.pendingIncidentCount || 0),
    requiresReconciliation: Boolean(payload?.requiresReconciliation),
    requiresReceivingCount: Boolean(payload?.requiresReceivingCount),
    incomingCount: payload?.incomingCount ?? null,
    canCurrentUserClose: Boolean(payload?.canCurrentUserClose),
    canCurrentUserResume: Boolean(payload?.canCurrentUserResume),
    lastSyncAt: payload?.lastSyncAt ?? new Date().toISOString(),
    code: payload?.code ?? null,
    message: payload?.message ?? null,
  };
}

export function CashSessionProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState(initialState);
  const sequenceRef = useRef(0);
  const pendingRefreshRef = useRef(null);

  const resetCashState = useCallback(() => {
    sequenceRef.current += 1;
    pendingRefreshRef.current = null;
    setState(initialState);
  }, []);

  const refreshCashState = useCallback(async ({ force = false } = {}) => {
    if (!isAuthenticated) {
      resetCashState();
      return null;
    }

    if (pendingRefreshRef.current && !force) {
      return pendingRefreshRef.current;
    }

    const sequence = sequenceRef.current + 1;
    sequenceRef.current = sequence;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const promise = fetchCashState()
      .then((payload) => {
        if (sequenceRef.current !== sequence) return null;
        const mapped = mapState(payload);
        setState((prev) => ({
          ...prev,
          ...mapped,
          loading: false,
          opening: false,
        }));
        return mapped;
      })
      .catch((error) => {
        if (sequenceRef.current !== sequence) return null;
        const mapped = {
          station: null,
          cashSession: null,
          cashStatus: CASH_STATUS.ERROR,
          error: error?.message || "No se pudo comprobar el estado del turno.",
          requiresReconciliation: false,
          requiresReceivingCount: false,
          incomingCount: null,
          balanceInitialized: false,
          currentBalance: null,
          policy: null,
          pendingIncidentCount: 0,
          capabilities: initialState.capabilities,
          canCurrentUserClose: false,
          canCurrentUserResume: false,
          lastSyncAt: new Date().toISOString(),
          code: error?.code || "CASH_STATE_ERROR",
          message: error?.message || "No se pudo comprobar el estado del turno.",
        };
        setState((prev) => ({
          ...prev,
          ...mapped,
          loading: false,
          opening: false,
        }));
        return mapped;
      })
      .finally(() => {
        if (pendingRefreshRef.current === promise) {
          pendingRefreshRef.current = null;
        }
      });

    pendingRefreshRef.current = promise;
    return promise;
  }, [isAuthenticated, resetCashState]);

  const initializeCashBalance = useCallback(async ({ amount, category, reason, idempotencyKey }) => {
    if (!isAuthenticated) {
      throw new Error("La sesion de usuario ya no esta activa.");
    }

    setState((prev) => ({ ...prev, opening: true, error: null }));
    try {
      await initializeCashBalanceRequest({ amount, category, reason, idempotencyKey });
      const payload = await fetchCashState();
      const mapped = mapState(payload);
      setState((prev) => ({
        ...prev,
        ...mapped,
        loading: false,
        opening: false,
      }));
      return mapped;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        opening: false,
        error: error?.message || "No se pudo inicializar el saldo.",
        code: error?.code || "CASH_BALANCE_INIT_ERROR",
      }));
      throw error;
    }
  }, [isAuthenticated]);

  const openCashSession = useCallback(async ({ idempotencyKey, receivedAmount, receivingDiscrepancyReason, reportOpeningDifference }) => {
    if (!isAuthenticated) {
      throw new Error("La sesion de usuario ya no esta activa.");
    }

    setState((prev) => ({ ...prev, opening: true, error: null }));
    try {
      const payload = await openCashSessionRequest({
        idempotencyKey,
        receivedAmount,
        receivingDiscrepancyReason,
        reportOpeningDifference,
      });
      const mapped = mapState(payload);
      setState((prev) => ({
        ...prev,
        ...mapped,
        loading: false,
        opening: false,
      }));
      return mapped;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        opening: false,
        error: error?.message || "No se pudo abrir el turno.",
        code: error?.code || "CASH_OPEN_ERROR",
      }));
      throw error;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      resetCashState();
      return;
    }
    refreshCashState({ force: true });
  }, [isAuthenticated, refreshCashState, resetCashState, user?.idUsuario]);

  const value = useMemo(() => {
    const isOpen = state.cashStatus === CASH_STATUS.OPEN && state.canCurrentUserResume;
    const requiresOpening =
      state.cashStatus === CASH_STATUS.NO_SESSION ||
      state.cashStatus === CASH_STATUS.RECEIVING_COUNT_REQUIRED ||
      state.cashStatus === CASH_STATUS.CLOSED ||
      state.cashStatus === CASH_STATUS.CLOSED_BY_SUPERVISOR;
    const requiresBalanceSetup = state.cashStatus === CASH_STATUS.BALANCE_NOT_INITIALIZED;
    const belongsToCurrentUser =
      state.cashSession?.openedBy?.id && user?.idUsuario
        ? state.cashSession.openedBy.id === user.idUsuario
        : state.canCurrentUserResume;

    return {
      ...state,
      isOpen,
      requiresOpening,
      requiresBalanceSetup,
      belongsToCurrentUser,
      refreshCashState,
      initializeCashBalance,
      openCashSession,
      resetCashState,
    };
  }, [initializeCashBalance, openCashSession, refreshCashState, resetCashState, state, user?.idUsuario]);

  return (
    <CashSessionContext.Provider value={value}>
      {children}
    </CashSessionContext.Provider>
  );
}

export function useCashSession() {
  const ctx = useContext(CashSessionContext);
  if (!ctx) throw new Error("useCashSession must be used within CashSessionProvider");
  return ctx;
}
