import React, { useState, useEffect } from "react";
import { get, set } from "@vercel/edge-config"; // Importa funciones de Edge Config
import "./App.css";

function App() {
  const [users, setUsersState] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [debtPerson, setDebtPerson] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [view, setView] = useState("main");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [participants, setParticipants] = useState([]);

  // Cargar usuarios desde Edge Config al iniciar
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const storedUsers = (await get("users")) || []; // Cargar usuarios desde Edge Config
        setUsersState(storedUsers);
      } catch (error) {
        console.error("Error al cargar usuarios desde Edge Config:", error);
      }
    };
    loadUsers();
  }, []);

  // Guardar usuarios en Edge Config
  const saveUsers = async (updatedUsers) => {
    try {
      await set("users", updatedUsers); // Guardar usuarios en Edge Config
      setUsersState(updatedUsers);
    } catch (error) {
      console.error("Error al guardar usuarios en Edge Config:", error);
    }
  };

  // Agregar un nuevo usuario
  const addUser = async () => {
    if (newUserName.trim() === "") return;
    if (users.some((user) => user.name === newUserName)) {
      alert("El usuario ya existe.");
      return;
    }
    const newUser = { name: newUserName, debts: [] };
    const updatedUsers = [...users, newUser];
    await saveUsers(updatedUsers);
    setNewUserName("");
  };

  // Eliminar un usuario
  const removeUser = async (userName) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${userName}?`)) {
      const updatedUsers = users.filter((user) => user.name !== userName);
      await saveUsers(updatedUsers);
    }
  };

  // Agregar deuda
  const addDebt = async () => {
    if (!selectedUser || debtPerson.trim() === "" || debtAmount <= 0) return;
    const updatedUsers = users.map((user) => {
      if (user.name === selectedUser.name) {
        return {
          ...user,
          debts: [...user.debts, { person: debtPerson, amount: parseFloat(debtAmount) }],
        };
      }
      return user;
    });
    await saveUsers(updatedUsers);
    setDebtPerson("");
    setDebtAmount("");
  };

  // Agregar gasto y ajustar deudas
  const addExpense = async () => {
    if (!payer || expenseAmount <= 0 || participants.length <= 1) return;
    const amountPerPerson = parseFloat(expenseAmount) / participants.length;

    const updatedUsers = users.map((user) => {
      if (participants.includes(user.name)) {
        if (user.name === payer) return user; // Saltar al pagador

        let updatedDebts = [...user.debts];
        const existingDebtToPayer = user.debts.find((d) => d.person === payer);
        const payerIndex = users.findIndex((u) => u.name === payer);

        const participantDebtToPayer =
          (existingDebtToPayer?.amount || 0) + amountPerPerson;

        if (payerIndex !== -1) {
          const debtFromPayer = users[payerIndex].debts.find(
            (d) => d.person === user.name
          );

          const adjustedDebt =
            participantDebtToPayer - (debtFromPayer?.amount || 0);

          if (adjustedDebt > 0) {
            updatedDebts = updatedDebts.filter((debt) => debt.person !== payer);
            updatedDebts.push({ person: payer, amount: adjustedDebt });
          } else if (adjustedDebt < 0) {
            users[payerIndex].debts = users[payerIndex].debts.filter(
              (debt) => debt.person !== user.name
            );
            users[payerIndex].debts.push({
              person: user.name,
              amount: -adjustedDebt,
            });
            updatedDebts = updatedDebts.filter((debt) => debt.person !== payer);
          } else {
            updatedDebts = updatedDebts.filter((debt) => debt.person !== payer);
            users[payerIndex].debts = users[payerIndex].debts.filter(
              (debt) => debt.person !== user.name
            );
          }
        }

        return { ...user, debts: updatedDebts };
      }
      return user;
    });

    await saveUsers(updatedUsers);
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
      <h1>CuentasAPP</h1>

      {view === "main" && (
        <div>
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
            <input
              type="number"
              placeholder="Monto total"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
            />
            <select value={payer} onChange={(e) => setPayer(e.target.value)}>
              <option value="">Seleccionar pagador</option>
              {users.map((user) => (
                <option key={user.name} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
            <div>
              <h3>Participantes</h3>
              {users.map((user) => (
                <label key={user.name}>
                  <input
                    type="checkbox"
                    checked={participants.includes(user.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setParticipants([...participants, user.name]);
                      } else {
                        setParticipants(participants.filter((p) => p !== user.name));
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
                <button onClick={() => removeUser(user.name)}>Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "details" && selectedUser && (
        <div className="details-view">
          <button onClick={handleBackToMain}>Volver</button>
          <h2>Deudas de {selectedUser.name}</h2>
          <ul>
            {selectedUser.debts.map((debt, index) => (
              <li key={index}>
                {debt.person}: ${debt.amount}
              </li>
            ))}
          </ul>
          <div>
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
