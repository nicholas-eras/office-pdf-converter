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
      toast.error((await response.json()).message ?? 'Erro ao enviar o arquivo:');    
    }

    return await response.json();
  } catch (error) {
    toast.error((await response.json()).message ?? 'Erro no upload do arquivo:');    
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
      throw new Error(`Upload failed: ${response.status}`);
    }
    return "Arquivo enviado com sucesso!";
  } catch (error) {
    toast.error((await response.json()).message ?? 'Erro ao enviar o arquivo:');    
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
      toast.error((await response.json())?.message ?? "Erro ao obter URL pré-assinada");
      return false;
    }
    const res =  await response.json();
    console.log(res);
    const { url, remainingUploads } = res;

    await putToS3(url, file);
    return remainingUploads;
  } catch (error) {
    toast.error((await response.json()).message ?? 'Erro ao enviar o arquivo:');    
  }
}

import Router from 'next/router';
import { toast } from 'react-toastify';

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
    toast.error((await response.json()).message ?? 'Erro ao baixar o arquivo:');    
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
    toast.error((await response.json()).message ?? 'Erro ao deletar o arquivo:');    
  }
};

export async function getFile(fileId) {
  try {   
    const token = localStorage.getItem('token');   
    const response = await fetch('http://localhost:3000/file/' + fileId + "/pdf", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, 
      },      
    });
    return await response.json()   
  } catch (error) {
    toast.error((await response.json()).message ?? 'Erro ao obter o arquivo:');    
  }
}
