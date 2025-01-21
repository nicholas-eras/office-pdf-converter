export async function uploadFile(file) {
  try {
    const formData = new FormData();
    formData.append('file', file); // Adiciona o arquivo ao FormData
    const token = localStorage.getItem('token'); // Obtém o token do localStorage

    const response = await fetch('http://localhost:3000/file/convert/', {
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
import Router from 'next/router';

export async function userFiles() {  
  try {
    const token = localStorage.getItem('token');

    const response = await fetch('http://localhost:3000/users/files/', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`, 
      },
    });
    if (!response.ok) {
      Router.push('/login');
      throw new Error('Erro ao obter arquivo');
    }

    return await response.json();
  } catch (error) {
    Router.push('/login');
    console.error('Erro ao obter arquivo:', error);
    throw error;
  }
}

export async function downloadFile(fileName) {
  try {
    // Faça uma requisição POST para o endpoint de download. 
    // Usamos POST aqui porque queremos enviar o nome do arquivo no corpo da requisição.   
    const token = localStorage.getItem('token');   
    const response = await fetch('http://localhost:3000/file/download/', {
      method: 'POST',
      body:JSON.stringify({
        fileName: fileName
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, 
      },
      responseType: 'blob', // importante para obter o arquivo como um Blob
    });
    return response   
  } catch (error) {
    console.error('Erro ao baixar o arquivo:', error);
    // Lidar com o erro, talvez mostrando uma mensagem para o usuário
  }
};

export default downloadFile;

