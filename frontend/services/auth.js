export async function registerUser(userData) {
  try {
    const response = await fetch('http://localhost:3000/users/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Erro ao registrar usuário');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function loginUser(credentials) {
  try {
    const response = await fetch('http://localhost:3000/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Erro ao fazer login');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}
