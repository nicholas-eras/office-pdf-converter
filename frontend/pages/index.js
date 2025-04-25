import React, { useState, useEffect, useRef } from 'react';
import { uploadToS3, userFiles, deleteFile } from '../services/file';
import AuthRequired from '../services/auth-required';
import { downloadFile, getFile } from '../services/file';
import io from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from "jwt-decode";

function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(true);

  const token = localStorage.getItem('token');     
  if (!token){
    window.location.href = '/login';
  }
  const userId = jwtDecode(token).sub; 

  const socket = io('http://localhost:3000');

  const filesPerPage = 5;
  const maxFileSize = 10;
  const maxFileSizeMb = maxFileSize * 1000 * 1000;
  const acceptFiles = [
    // Arquivos do Office
    ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".odt", ".ods", ".odp", ".rtf", ".csv", ".txt", ".pdf",
    // Imagens
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif", ".svg", ".webp"
  ];

  const uploadedFilesRef = useRef([]);

  useEffect(() => {
    uploadedFilesRef.current = uploadedFiles;
  }, [uploadedFiles]);

  useEffect(() => {
    fetchFilesStatus();

    socket.on("connect", () => {

      setSocketConnected(true); 
      socket.on(userId.toString(), async(data) => {        
        if (!data) return;

        const {fileName, status} = data;

        try {                    
          const fileToUpdate = uploadedFilesRef.current.find(file =>`${userId}_${file.fileName}` === fileName);    
          if (!fileToUpdate) {
            return;
          }
  
          let pdfInfo = {};
          if (status === "done") {
            try {
              pdfInfo =  await getFile(fileToUpdate.id);
            } catch (error) {
              console.error('Error fetching PDF:', error);
              toast.error('Erro ao buscar informações do PDF');
            }
          }

          setUploadedFiles(prevFiles => prevFiles.map(file => 
            `${userId}_${file.fileName}` === fileName
              ? { ...file, status: status, pdf: pdfInfo }
              : file
          ));
  
        } catch (error) {
          console.error('Error updating file:', error);
          toast.error('Erro ao atualizar arquivo');
        }
      });
    });  

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });        

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('file-to-conversion-queue');
    };
  }, []);

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    if (selectedFile.size >= maxFileSizeMb) {
      toast.error(`Arquivo não deve possuir mais do que ${maxFileSize}Mb`);
      resetInput();
      return;
    }

    const fileExtension = `.${selectedFile.name.split(".").pop().toLowerCase()}`;
    if (!acceptFiles.includes(fileExtension)) {
      toast.error(`Extensão de arquivo ${fileExtension} não suportada.`);
      resetInput();
      return;
    }
    setFile(selectedFile);
  };

  const resetInput = () => {
    setFile(null);
    const input = document.getElementById("file-upload");
    if (input) input.value = "";
  };

  const fetchFilesStatus = async () => {
    try {
      const filesFromBackend = await userFiles();
      setUploadedFiles(filesFromBackend);
    } catch (error) {
      if (error.message === 'Unauthorized') {
        handleAuthError();
      } else {
        toast.error('Erro ao carregar arquivos.');
      }
      setUploadedFiles([]);
    }
    return;
  };

  const handleFileSend = async () => {
    if (!file) {
      toast.warn('Por favor, selecione pelo menos um arquivo para enviar.');
      return;
    }
  
    if (!socketConnected) {
      toast.error('Não foi possível estabelecer conexão com o servidor.');
      return;
    }
  
    setIsUploading(true);
    try {      
      await uploadToS3(file);

      socket.emit('file-to-conversion-queue', file.name, (file) => {
        setUploadedFiles((prevFiles) => [
          { fileName: file.fileName, status: "awaiting", id: file.id },
          ...prevFiles
        ]);
      });

      toast.success('Arquivo enviado com sucesso!');
    } catch (error) {
      if (error.message === 'Unauthorized') {
        handleAuthError();
      } else {
        console.error(error);
        toast.error('Erro ao enviar o arquivo.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadFile = async (fileName, type) => {
    try {
      const response = await downloadFile(fileName, type);
      
      if (!response.ok) {
        throw new Error('Erro ao baixar o arquivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar o arquivo:', error);
      toast.error('Ocorreu um erro ao tentar baixar o arquivo. Por favor, tente novamente.');
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const response = await deleteFile(fileId);
      if (response.ok) {
        setUploadedFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
        toast.success('Arquivo excluído com sucesso!');
      } else {
        throw new Error('Erro ao excluir o arquivo');
      }
    } catch (error) {
      if (error.message === 'Unauthorized') {
        handleAuthError();
      } else {
        toast.error('Ocorreu um erro ao tentar excluir o arquivo. Por favor, tente novamente.');
      }
    }
  };

  const handleAuthError = () => {
    toast.error('Você precisa fazer login novamente.', {
      onClose: () => {
        window.location.href = '/login';
      }
    });
  };

  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = uploadedFiles?.slice(indexOfFirstFile, indexOfLastFile);
 
  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-4xl sm:mx-auto w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="mb-8 text-3xl font-bold text-center text-gray-900">Upload de Arquivos</h1>
          
          {!socketConnected && (
            <div className="mb-4 p-4 bg-yellow-100 text-yellow-700 rounded">
              Tentando reconectar ao servidor...
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="file-upload" className="block mb-2 text-sm font-medium text-gray-700">
              Selecione arquivos para upload
            </label>
            <div className="relative w-full flex items-center">
              <input 
                id="file-upload"
                type="file" 
                onChange={handleFileUpload}
                accept={acceptFiles.join(",")}
                className="block text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                style={{width: file ? 'calc(100% - 40px)' : '100%'}}
                disabled={isUploading}
              />
              {file && (
                <button
                  type="button"
                  onClick={resetInput}
                  className="absolute right-2 text-red-500 hover:text-red-700"
                  disabled={isUploading}
                >
                  ❌
                </button>
              )}
            </div>
            <button 
              onClick={handleFileSend}
              disabled={isUploading || !socketConnected}
              className={`mt-4 text-white font-bold py-2 px-4 rounded w-full ${
                isUploading || !socketConnected ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isUploading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
          
          <h2 className="mb-4 text-2xl font-semibold text-center text-gray-900">Arquivos Enviados</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-gray-300">
              <thead>
                <tr>
                  <th className="px-4 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nome do Arquivo</th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentFiles.map((file, index) => (
                  <tr key={file.id || index} className="hover:bg-gray-100">
                    <td className="px-4 py-4 whitespace-nowrap border-b border-gray-200">{file.fileName}</td>
                    <td className="px-4 py-4 whitespace-nowrap border-b border-gray-200">
                      <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${
                        file.status === 'done' ? 'bg-green-500' : 
                        file.status === 'processing' ? 'bg-yellow-500' : 
                        'bg-blue-500'
                      }`}>
                        {file.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap border-b border-gray-200 text-sm font-medium">
                      <button 
                        onClick={() => handleDownloadFile(file.fileName, 'original')}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        Original
                      </button>
                      {file.status === "done" && file.pdf && (
                        <button 
                          onClick={() => handleDownloadFile(file.pdf.fileName, 'pdf')}
                          className="text-green-600 hover:text-green-900 mr-2"
                        >
                          PDF
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-l ${
                currentPage === 1 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
              }`}
            >
              Anterior
            </button>
            <button 
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={indexOfLastFile >= uploadedFiles.length}
              className={`px-4 py-2 rounded-r ${
                indexOfLastFile >= uploadedFiles.length 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
              }`}
            >
              Próximo
            </button>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </div>
  );
}

export default AuthRequired(UploadPage);