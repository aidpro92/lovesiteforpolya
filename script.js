const supabaseUrl = 'https://gznlrjgykogygsaxgzxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bmxyamd5a29neWdzYXhnenhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxMTIwODksImV4cCI6MjA1NDY4ODA4OX0.VhyWvMy0_7_OB_gsAWFwXksmch3fYKrMu5KhJxi1JMk';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

let isPlaying = false;


window.toggleMusic = function() {
    const music = document.getElementById('background-music');
    if (isPlaying) {
        music.pause();
        isPlaying = false;
    } else {
        music.play()
            .then(() => isPlaying = true)
            .catch(error => alert('Ошибка воспроизведения: ' + error));
    }
};


window.saveLetter = async function() {
    const text = document.getElementById('letter-text').value;
    const author = document.getElementById('letter-author').value;
    if (!text) return alert('Напиши текст письма');

    try {
        const { error } = await supabase
            .from('letters')
            .insert([{ author, text, date: new Date().toLocaleDateString() }]);
        
        if (error) throw error;
        document.getElementById('letter-text').value = '';
    } catch (error) {
        console.error('Ошибка сохранения письма:', error);
        alert('Ошибка сохранения письма');
    }
};

async function loadLetters() {
    const list = document.getElementById('letters-list');
    
    try {
        
        const { data: letters, error } = await supabase
            .from('letters')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        
        list.innerHTML = letters.map(letter => `
            <div class="letter-item">
                <strong>${letter.author === 'me' ? 'Я' : 'Ты'} (${letter.date}):</strong>
                <p>${letter.text}</p>
            </div>
        `).join('');

        
        supabase.channel('letters')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'letters' }, 
                payload => {
                    const newLetter = payload.new;
                    list.innerHTML = `
                        <div class="letter-item">
                            <strong>${newLetter.author === 'me' ? 'Я' : 'Ты'} (${newLetter.date}):</strong>
                            <p>${newLetter.text}</p>
                        </div>
                    ` + list.innerHTML;
                }
            )
            .subscribe();

    } catch (error) {
        console.error('Ошибка загрузки писем:', error);
    }
}


window.uploadPhotos = async function() {
    const files = document.getElementById('upload-photo').files;
    const description = document.getElementById('photo-description').value;

    try {
        for (const file of files) {
            const fileName = `${Date.now()}-${file.name}`;
            
            
            const { error: uploadError } = await supabase.storage
                .from('photos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;
            
            
            const { data: urlData } = supabase.storage
                .from('photos')
                .getPublicUrl(fileName);

            // БД
            const { error: dbError } = await supabase
                .from('photos')
                .insert([{ src: urlData.publicUrl, description }]);

            if (dbError) throw dbError;
        }
        
        document.getElementById('photo-description').value = '';
        alert('Фото загружены!');
    } catch (error) {
        console.error('Ошибка загрузки фото:', error);
        alert('Ошибка загрузки фото');
    }
};

async function loadPhotos() {
    const grid = document.getElementById('photo-grid');
    
    try {
        
        const { data: photos, error } = await supabase
            .from('photos')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        
        grid.innerHTML = photos.map(photo => `
            <div class="photo-item">
                <img src="${photo.src}" alt="${photo.description}">
                <div class="description">${photo.description}</div>
            </div>
        `).join('');

        
        supabase.channel('photos')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'photos' }, 
                payload => {
                    const newPhoto = payload.new;
                    grid.innerHTML = `
                        <div class="photo-item">
                            <img src="${newPhoto.src}" alt="${newPhoto.description}">
                            <div class="description">${newPhoto.description}</div>
                        </div>
                    ` + grid.innerHTML;
                }
            )
            .subscribe();

    } catch (error) {
        console.error('Ошибка загрузки фото:', error);
    }
}


window.addEvent = async function() {
    const date = document.getElementById('event-date').value;
    const description = document.getElementById('event-description').value;

    if (!date || !description) return alert('Заполни все поля');

    try {
        const { error } = await supabase
            .from('events')
            .insert([{ date, description }]);

        if (error) throw error;
        
        document.getElementById('event-date').value = '';
        document.getElementById('event-description').value = '';
        alert('Событие добавлено!');
    } catch (error) {
        console.error('Ошибка добавления события:', error);
        alert('Ошибка добавления события');
    }
};

async function loadEvents() {
    const timeline = document.getElementById('timeline-events');
    
    try {
        
        const { data: events, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        
        timeline.innerHTML = events.map(event => `
            <div class="event">
                <div class="date">${new Date(event.date).toLocaleDateString()}</div>
                <div class="description">${event.description}</div>
            </div>
        `).join('');

        
        supabase.channel('events')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'events' }, 
                payload => {
                    const newEvent = payload.new;
                    timeline.innerHTML += `
                        <div class="event">
                            <div class="date">${new Date(newEvent.date).toLocaleDateString()}</div>
                            <div class="description">${newEvent.description}</div>
                        </div>
                    `;
                }
            )
            .subscribe();

    } catch (error) {
        console.error('Ошибка загрузки событий:', error);
    }
}


window.onload = () => {
    AOS.init();
    loadLetters();
    loadPhotos();
    loadEvents();
};