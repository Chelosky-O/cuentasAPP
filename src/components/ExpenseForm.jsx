import React, { useState } from "react";

function ExpenseForm({ users, setUsers }) {
  const [payer, setPayer] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [participants, setParticipants] = useState([]);

  const toggleSelectAllParticipants = () => {
    if (participants.length === users.length) {
      // Si todos están seleccionados, deseleccionamos todos
      setParticipants([]);
    } else {
      // Seleccionamos a todos
      setParticipants(users.map((user) => user.name));
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

    setUsers(updatedUsers);
    setExpenseAmount("");
    setPayer("");
    setParticipants([]);
  };

  return (
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
        <label className="participant">
          <input
            type="checkbox"
            onChange={toggleSelectAllParticipants}
            checked={participants.length === users.length} // Si todos están seleccionados
          />
          Seleccionar Todos
        </label>
        <div className="participants-container">
          {users.map((user) => (
            <label key={user.id} className="participant">
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
      </div>
      <button onClick={addExpense}>Agregar Gasto</button>
    </div>
  );
}

export default ExpenseForm;
