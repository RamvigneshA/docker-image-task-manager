import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const fetchTasks = () => {
    axios.get('http://localhost:5001/tasks')
      .then(res => setTasks(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (imageFile) formData.append('image', imageFile);

      await axios.post('http://localhost:5001/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setTitle('');
      setDescription('');
      setImageFile(null);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Tasks</h1>

      {/* Task creation form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <br />
        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <br />
        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files[0])}
        />
        <br />
        <button type="submit">Add Task</button>
      </form>

      {/* Task list */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {tasks.map(task => (
          <div key={task.id} style={{ border: '1px solid #ccc', padding: '8px', width: '200px' }}>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <img
              src={`http://localhost:5001/tasks/${task.id}/thumbnail`}
              alt={task.title}
              style={{ cursor: 'pointer', width: '100%' }}
              onClick={() => setSelectedImage(`http://localhost:5001/tasks/${task.id}/image`)}
            />
          </div>
        ))}
      </div>

      {/* Full-size overlay */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            cursor: 'pointer',
          }}
        >
          <img src={selectedImage} alt="Full Size" style={{ maxHeight: '90%', maxWidth: '90%' }} />
        </div>
      )}
    </div>
  );
};

export default TaskList;