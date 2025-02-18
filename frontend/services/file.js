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

const putToS3 = async (url, file) => {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 
        'Content-Type': file.type,
      },
      body: file
    });
    
    if (!response.ok) {
      console.log(response);
      throw new Error(`Upload failed: ${response.status}`);
    }
    return "Arquivo enviado com sucesso!";
  } catch (error) {
    throw error;
  }
};

export async function uploadToS3(file) {  
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:3000/file/pre-signed-url", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body:JSON.stringify({
        filename: file.name,
        contentType: file.type 
      })
    });

    if (!response.ok) {
      throw new Error("Erro ao obter a URL pré-assinada");
    }

    const { url } = await response.json();

    const result = await putToS3(url, file);
  } catch (error) {
    console.error("Erro no upload para o S3:", error);
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
    const token = localStorage.getItem('token');   
    const response = await fetch('http://localhost:3000/file/download/' + encodeURIComponent(fileName), {
      method: 'GET',     
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, 
      },
      responseType: 'blob', 
    });
    return response   
  } catch (error) {
    console.error('Erro ao baixar o arquivo:', error);    
  }
};

export async function deleteFile(fileId) {
  try {   
    const token = localStorage.getItem('token');   
    const response = await fetch('http://localhost:3000/file/' + fileId, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, 
      },      
    });
    return response   
  } catch (error) {
    console.error('Erro ao deletar o arquivo:', error);    
  }
};

export async function getFile(fileId) {
  try {   
    const token = localStorage.getItem('token');   
    const response = await fetch('http://localhost:3000/file/' + fileId, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, 
      },      
    });
    return response   
  } catch (error) {
    console.error('Erro ao obter o arquivo:', error);    
  }
}
