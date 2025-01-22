import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import "./App.css";

function App() {
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [debtPerson, setDebtPerson] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [view, setView] = useState("main"); // main, details, log
  const [expenseAmount, setExpenseAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [participants, setParticipants] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState("all"); // all, payment, expense
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRecipient, setPaymentRecipient] = useState("");

  // Fetch users from Supabase on load
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        console.error("Error fetching users:", error.message);
      } else if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  const addUser = async () => {
    if (newUserName.trim() === "") {
      alert("El nombre del usuario no puede estar vacío.");
      return;
    }
    if (users.some((user) => user.name === newUserName)) {
      alert("El usuario ya existe.");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .insert([{ name: newUserName, debts: [] }])
      .select();

    if (error) {
      console.error("Error adding user:", error.message);
    } else if (Array.isArray(data)) {
      setUsers((prevUsers) => [...prevUsers, ...data]);
      setNewUserName("");
    }
  };

  const removeUser = async (userId) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar este usuario?`)) {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) {
        console.error("Error deleting user:", error.message);
      } else {
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      }
    }
  };

  const addExpense = async () => {
    if (!payer || expenseAmount <= 0 || participants.length === 0) {
      alert("Debes seleccionar un pagador, un monto y al menos un participante.");
      return;
    }
  
    const amountPerPerson = Math.ceil(parseFloat(expenseAmount) / participants.length);
  
    const updatedUsers = [...users];
    participants.forEach((participant) => {
      if (participant === payer) return;
  
      const participantData = updatedUsers.find((user) => user.name === participant);
      const payerData = updatedUsers.find((user) => user.name === payer);
  
      const existingDebt = participantData.debts.find((d) => d.person === payer);
      const payerDebt = payerData.debts.find((d) => d.person === participant);
  
      const netDebt = Math.ceil((existingDebt?.amount || 0) + amountPerPerson - (payerDebt?.amount || 0));
  
      if (netDebt > 0) {
        participantData.debts = [
          ...participantData.debts.filter((d) => d.person !== payer),
          { person: payer, amount: netDebt },
        ];
        payerData.debts = payerData.debts.filter((d) => d.person !== participant);
      } else if (netDebt < 0) {
        payerData.debts = [
          ...payerData.debts.filter((d) => d.person !== participant),
          { person: participant, amount: Math.abs(netDebt) },
        ];
        participantData.debts = participantData.debts.filter((d) => d.person !== payer);
      } else {
        participantData.debts = participantData.debts.filter((d) => d.person !== payer);
        payerData.debts = payerData.debts.filter((d) => d.person !== participant);
      }
    });
  
    for (const user of updatedUsers) {
      await supabase.from("users").update({ debts: user.debts }).eq("id", user.id);
    }
  
    const { error } = await supabase.from("payments_log").insert([
      {
        payer: payer,
        participants: participants,
        amount: Math.ceil(parseFloat(expenseAmount)),
        type: "expense",
      },
    ]);
  
    if (error) {
      console.error("Error registrando el log del gasto:", error.message);
    }
  
    setUsers(updatedUsers);
    setExpenseAmount("");
    setPayer("");
    setParticipants([]);
  };
  

  const handlePayment = async () => {
    if (!paymentRecipient || paymentAmount <= 0) {
      alert("Debes seleccionar una persona y un monto válido.");
      return;
    }
  
    const roundedPaymentAmount = Math.ceil(parseFloat(paymentAmount));
  
    const debt = selectedUser.debts.find((d) => d.person === paymentRecipient);
    if (!debt) {
      alert(`${selectedUser.name} no tiene deudas con ${paymentRecipient}.`);
      return;
    }
  
    const remainingDebt = debt.amount - roundedPaymentAmount;
  
    if (remainingDebt < 0) {
      alert("El monto a pagar excede la deuda actual.");
      return;
    }
  
    const confirmPayment = window.confirm(
      `¿Confirmas que ${selectedUser.name} pagará $${roundedPaymentAmount} a ${paymentRecipient}?`
    );
  
    if (!confirmPayment) return;
  
    const updatedDebts = remainingDebt > 0
      ? selectedUser.debts.map((d) =>
          d.person === paymentRecipient ? { ...d, amount: remainingDebt } : d
        )
      : selectedUser.debts.filter((d) => d.person !== paymentRecipient);
  
    const { error } = await supabase
      .from("users")
      .update({ debts: updatedDebts })
      .eq("id", selectedUser.id);
  
    if (error) {
      console.error("Error actualizando la deuda:", error.message);
      return;
    }
  
    const { error: logError } = await supabase.from("payments_log").insert([
      {
        payer: selectedUser.name,
        participants: [paymentRecipient],
        amount: roundedPaymentAmount,
        type: "payment",
      },
    ]);
  
    if (logError) {
      console.error("Error registrando el log del pago:", logError.message);
      return;
    }
  
    const { data: updatedUsers, error: fetchError } = await supabase
      .from("users")
      .select("*");
  
    if (fetchError) {
      console.error("Error actualizando los usuarios:", fetchError.message);
      return;
    }
  
    setUsers(updatedUsers);
  
    const updatedSelectedUser = updatedUsers.find((user) => user.id === selectedUser.id);
    setSelectedUser(updatedSelectedUser);
  
    setPaymentRecipient("");
    setPaymentAmount("");
    alert("El pago se ha realizado correctamente.");
  };
  

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("payments_log")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching logs:", error.message);
    } else {
      setLogs(data);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (logFilter === "payment") return log.type === "payment";
    if (logFilter === "expense") return log.type === "expense";
    return true;
  });

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setView("details");
  };

  const handleBackToMain = () => {
    setSelectedUser(null);
    setView("main");
  };

  const toggleSelectAllParticipants = () => {
    if (participants.length === users.length) {
      setParticipants([]);
    } else {
      setParticipants(users.map((user) => user.name));
    }
  };

  return (
    <div className="app-container">
      {view === "main" && (
        <div>
          <h1>CuentasAPP</h1>
          <div className="user-section">
            <h2>Crear Usuario</h2>
            <input
              type="text"
              placeholder="Nombre del usuario"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
            />
            <button onClick={addUser}>Agregar Usuario</button>
          </div>
          <div className="expense-section">
            <h2>Agregar Gasto</h2>
            <select value={payer} onChange={(e) => setPayer(e.target.value)}>
              <option value="">Seleccionar pagador</option>
              {users.map((user) => (
                <option key={user.id} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Monto total"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
            />
            <div>
              <h3>Participantes</h3>
              <label>
                <input
                  type="checkbox"
                  onChange={toggleSelectAllParticipants}
                  checked={participants.length === users.length}
                />
                Seleccionar Todos
              </label>
              {users.map((user) => (
                <label key={user.id}>
                  <input
                    type="checkbox"
                    checked={participants.includes(user.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setParticipants((prev) => [...prev, user.name]);
                      } else {
                        setParticipants((prev) =>
                          prev.filter((name) => name !== user.name)
                        );
                      }
                    }}
                  />
                  {user.name}
                </label>
              ))}
            </div>
            <button onClick={addExpense}>Agregar Gasto</button>
          </div>
          <div className="user-list">
            <h2>Usuarios</h2>
            {users.map((user) => (
              <div key={user.id} className="user-item">
                <span
                  className="user-name"
                  onClick={() => handleUserClick(user)}
                >
                  {user.name}
                </span>
                <button onClick={() => removeUser(user.id)}>Eliminar</button>
              </div>
            ))}
          </div>
          <button className="log-button" onClick={() => { setView("log"); fetchLogs(); }}>
            Ver Historial de Pagos
          </button>
        </div>
      )}

      {view === "details" && selectedUser && (
        <div className="details-view">
          <button className="back-button" onClick={handleBackToMain}>
            Volver
          </button>
          <h2>Deudas de {selectedUser.name}</h2>
          <ul>
            {selectedUser.debts.length > 0 ? (
              selectedUser.debts.map((debt, index) => (
                <li key={index}>
                  {debt.person}: ${debt.amount.toFixed(2)}
                </li>
              ))
            ) : (
              <p>No hay deudas registradas para este usuario.</p>
            )}
          </ul>
          <h2>¿Quién le debe a {selectedUser.name}?</h2>
          <table className="owed-table">
            <thead>
              <tr>
                <th>Persona</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((user) =>
                  user.debts.some((debt) => debt.person === selectedUser.name)
                )
                .map((user) => {
                  const debt = user.debts.find(
                    (d) => d.person === selectedUser.name
                  );
                  return (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>${debt.amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <div className="payment-section">
            <h3>Realizar Pago</h3>
            <select
              value={paymentRecipient}
              onChange={(e) => setPaymentRecipient(e.target.value)}
            >
              <option value="">Seleccionar persona</option>
              {selectedUser.debts.map((debt, index) => (
                <option key={index} value={debt.person}>
                  {debt.person} (Deuda: ${debt.amount.toFixed(2)})
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Monto a pagar"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
            <button onClick={handlePayment}>Pagar</button>
          </div>
        </div>
      )}

      {view === "log" && (
        <div className="log-view">
          <button className="back-button" onClick={() => setView("main")}>
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
                    <td>${log.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay registros disponibles.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
