package com.galtekone.config;

public class EmpresaContextHolder {
    private static final ThreadLocal<Integer> empresaIdHolder = new ThreadLocal<>();

    public static void setEmpresaId(Integer empresaId) {
        empresaIdHolder.set(empresaId);
    }

    public static Integer getEmpresaId() {
        return empresaIdHolder.get();
    }

    public static void clear() {
        empresaIdHolder.remove();
    }
}