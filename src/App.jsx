import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [debtPerson, setDebtPerson] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [view, setView] = useState("main");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [participants, setParticipants] = useState([]);

  // Load users from localStorage on app load
  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/usuarios/get");
      const data = await res.json();
      setUsers(data);
    };
  
    fetchUsers();
  }, []);
  

  // Add a new user
  const addUser = async () => {
    const res = await fetch("/api/usuarios/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newUserName }),
    });
  
    const data = await res.json();
    if (res.ok) setUsers((prev) => [...prev, data.user]);
  };
  

  // Remove a user
  const removeUser = async (name) => {
    const res = await fetch("/api/usuarios/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  
    if (res.ok) setUsers((prev) => prev.filter((user) => user.name !== name));
  };
  


  const updateDebts = async (name, debts) => {
    await fetch("/api/usuarios/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, debts }),
    });
  };

  
  // Add a debt to a user
  const addDebt = () => {
    if (!selectedUser || debtPerson.trim() === "" || debtAmount <= 0) return;

    setUsers((prevUsers) => {
      return prevUsers.map((user) => {
        if (user.name === selectedUser.name) {
          return {
            ...user,
            debts: [...user.debts, { person: debtPerson, amount: parseFloat(debtAmount) }],
          };
        }
        return user;
      });
    });

    setDebtPerson("");
    setDebtAmount("");
  };

  // Add an expense and distribute debts with consideration of existing debts
  const addExpense = () => {
    if (!payer || expenseAmount <= 0 || participants.length <= 1) return; // Deben haber al menos 2 personas
  
    const amountPerPerson = parseFloat(expenseAmount) / participants.length; // Parte que cada persona debe pagar
  
    setUsers((prevUsers) => {
      const updatedUsers = prevUsers.map((user) => {
        if (participants.includes(user.name)) {
          if (user.name === payer) return user; // Saltar al pagador
  
          let updatedDebts = [...user.debts];
          const existingDebtToPayer = user.debts.find((d) => d.person === payer);
          const payerIndex = prevUsers.findIndex((u) => u.name === payer);
  
          // Ajustar las deudas con base en la parte que debe cada persona
          const participantDebtToPayer =
            (existingDebtToPayer?.amount || 0) + amountPerPerson;
  
          if (payerIndex !== -1) {
            const debtFromPayer = prevUsers[payerIndex].debts.find(
              (d) => d.person === user.name
            );
  
            const adjustedDebt =
              participantDebtToPayer - (debtFromPayer?.amount || 0);
  
            if (adjustedDebt > 0) {
              // El participante le debe al pagador
              updatedDebts = updatedDebts.filter((debt) => debt.person !== payer);
              updatedDebts.push({ person: payer, amount: adjustedDebt });
  
              if (debtFromPayer) {
                prevUsers[payerIndex].debts = prevUsers[payerIndex].debts.filter(
                  (debt) => debt.person !== user.name
                );
              }
            } else if (adjustedDebt < 0) {
              // El pagador le debe al participante
              if (debtFromPayer) {
                prevUsers[payerIndex].debts = prevUsers[payerIndex].debts.filter(
                  (debt) => debt.person !== user.name
                );
              }
              prevUsers[payerIndex].debts.push({
                person: user.name,
                amount: -adjustedDebt,
              });
  
              updatedDebts = updatedDebts.filter((debt) => debt.person !== payer);
            } else {
              // Saldo neto es 0, eliminar todas las deudas entre ellos
              updatedDebts = updatedDebts.filter((debt) => debt.person !== payer);
              prevUsers[payerIndex].debts = prevUsers[payerIndex].debts.filter(
                (debt) => debt.person !== user.name
              );
            }
          }
  
          return { ...user, debts: updatedDebts };
        }
  
        return user;
      });
  
      return updatedUsers;
    });
  
    setExpenseAmount("");
    setPayer("");
    setParticipants([]);
  };
  
  

  
  const handleUserClick = (user) => {
    setSelectedUser(user);
    setView("details");
  };

  const handleBackToMain = () => {
    setSelectedUser(null);
    setView("main");
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
              <option key={user.name} value={user.name}>
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
              {users.map((user) => (
                <label key={user.name}>
                  <input
                    type="checkbox"
                    checked={participants.includes(user.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setParticipants((prev) => [...prev, user.name]);
                      } else {
                        setParticipants((prev) => prev.filter((name) => name !== user.name));
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
              <div key={user.name} className="user-item">
                <span onClick={() => handleUserClick(user)}>{user.name}</span>
                <button
                  className="delete-button"
                  onClick={() => removeUser(user.name)}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "details" && selectedUser && (
        <div className="details-view">
          <button className="back-button" onClick={handleBackToMain}>
            Volver
          </button>
          <h2>Deudas de {selectedUser.name}</h2>
          <ul>
            {users
              .filter((user) => user.name !== selectedUser.name)
              .map((user) => {
                const debt = selectedUser.debts.find((d) => d.person === user.name);
                return (
                  <li key={user.name}>
                    {user.name}: ${debt ? debt.amount : 0}
                  </li>
                );
              })}
          </ul>

          <div className="add-debt">
            <h3>Agregar Deuda</h3>
            <input
              type="text"
              placeholder="Persona"
              value={debtPerson}
              onChange={(e) => setDebtPerson(e.target.value)}
            />
            <input
              type="number"
              placeholder="Monto"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
            />
            <button onClick={addDebt}>Agregar Deuda</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;