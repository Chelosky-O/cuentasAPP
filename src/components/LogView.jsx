import React from "react";
import { supabase } from "../supabase"; // Asegúrate de que la ruta sea correcta


function LogView({ logs, logFilter, setLogFilter, onBack }) {
  const filteredLogs = logs.filter((log) => {
    if (logFilter === "payment") return log.type === "payment";
    if (logFilter === "expense") return log.type === "expense";
    return true; // Mostrar todo si es "all"
  });

  return (
    <div className="log-view">
      <button className="back-button" onClick={onBack}>
        Volver
      </button>
      <h2>Historial de Pagos y Gastos</h2>

      <div className="log-filter">
        <button onClick={() => setLogFilter("all")}>Todos</button>
        <button onClick={() => setLogFilter("payment")}>Pagos</button>
        <button onClick={() => setLogFilter("expense")}>Gastos</button>
      </div>

      {filteredLogs.length > 0 ? (
        <table className="log-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Pagador</th>
              <th>Participantes</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.type === "payment" ? "Pago" : "Gasto"}</td>
                <td>{log.payer}</td>
                <td>{log.participants.join(", ")}</td>
                <td>${Math.ceil(log.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay registros disponibles.</p>
      )}
    </div>
  );
}

export default LogView;
