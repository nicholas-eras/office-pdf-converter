export async function uploadFile(file) {
  try {
    const formData = new FormData();
    formData.append('file', file); // Adiciona o arquivo ao FormData
    const token = localStorage.getItem('token'); // Obtém o token do localStorage

    const response = await fetch('http://localhost:3000/convert-file/', {
      method: 'POST',
      body: formData, // O FormData é enviado diretamente como o corpo,
      headers: {
        Authorization: `Bearer ${token}`, // Adiciona o token no cabeçalho
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar arquivo');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro no upload do arquivo:', error);
    throw error;
  }
}
