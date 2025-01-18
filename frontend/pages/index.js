import { useState, useEffect } from 'react';
import { uploadFile } from '../services/file';

function UploadPage() {
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 5;

  const handleFileUpload = (event) => {
    const fileList = Array.from(event.target.files);
    setFiles(fileList);
  };

  useEffect(() => {
    const fetchFilesStatus = async () => {
      const filesFromBackend = [
        { id: 1, name: 'documento.docx', status: 'awaiting', pdf: 'documento.pdf' },
        { id: 2, name: 'relatorio.xlsx', status: 'processing', pdf: 'relatorio.pdf' },
        { id: 3, name: 'apresentacao.pptx', status: 'done', pdf: 'apresentacao.pdf' },
        { id: 4, name: 'outro.docx', status: 'done', pdf: 'outro.pdf' },
        { id: 5, name: 'maisum.docx', status: 'awaiting', pdf: 'maisum.pdf' },
        { id: 6, name: 'muitomais.docx', status: 'processing', pdf: 'muitomais.pdf' }
      ];
      setUploadedFiles(filesFromBackend);
    };
    fetchFilesStatus();
  }, []);

  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = uploadedFiles.slice(indexOfFirstFile, indexOfLastFile);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const downloadFile = (fileName, type) => {
    const url = type === 'pdf' ? fileName : fileName.split('.pdf')[0] + '.' + fileName.split('.')[1];
    const link = document.createElement('a');
    link.href = url; // Substitua por uma URL real ou use uma API para obter o arquivo
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSend = async() => {
    if (files.length === 0) {
      alert('Por favor, selecione pelo menos um arquivo para enviar.');
      return;
    }
    // Aqui você faria uma requisição ao backend para enviar os arquivos
    console.log('Enviando arquivos:', files);
    // Limpar a seleção de arquivos após o envio
    const response = await uploadFile(files[0]);
    console.log(response);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-4xl sm:mx-auto w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="mb-8 text-3xl font-bold text-center text-gray-900">Upload de Arquivos</h1>
          <div className="mb-6">
            <label htmlFor="file-upload" className="block mb-2 text-sm font-medium text-gray-700">
              Selecione arquivos para upload
            </label>
            <input 
              id="file-upload"
              type="file" 
              onChange={handleFileUpload}
              multiple
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button 
              onClick={handleFileSend}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
              Enviar
            </button>
          </div>
          
          <h2 className="mb-4 text-2xl font-semibold text-center text-gray-900">Arquivos Enviados:</h2>
          <div className="overflow-hidden">
            <table className="w-full bg-white border border-gray-300">
              <thead>
                <tr>
                  <th className="px-4 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nome do Arquivo</th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PDF</th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentFiles.map((file, index) => (
                  <tr key={file.id} className="hover:bg-gray-100">
                    <td className="px-4 py-4 whitespace-nowrap border-b border-gray-200">{file.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap border-b border-gray-200">{file.pdf}</td>
                    <td className="px-4 py-4 whitespace-nowrap border-b border-gray-200">
                      <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full 
                        ${file.status === 'done' ? 'bg-green-500' : 
                        file.status === 'processing' ? 'bg-yellow-500' : 
                        'bg-blue-500'}`}>
                        {file.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap border-b border-gray-200 text-sm font-medium">
                      <button onClick={() => downloadFile(file.name, 'original')} className="text-blue-600 hover:text-blue-900 mr-2">Original</button>
                      {file.status === "done" && 
                      <button onClick={() => downloadFile(file.pdf, 'pdf')} className="text-green-600 hover:text-green-900">PDF</button>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l">
              Anterior
            </button>
            <button 
              onClick={() => paginate(currentPage + 1)} 
              disabled={indexOfLastFile >= uploadedFiles.length}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r">
              Próximo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;