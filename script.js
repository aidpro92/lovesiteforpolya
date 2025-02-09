
const supabaseUrl = 'https://gznlrjgykogygsaxgzxh.supabase.co'; // URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bmxyamd5a29neWdzYXhnenhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxMTIwODksImV4cCI6MjA1NDY4ODA4OX0.VhyWvMy0_7_OB_gsAWFwXksmch3fYKrMu5KhJxi1JMk'; // Public Key
const supabase = supabase.createClient(supabaseUrl, supabaseKey);


let isPlaying = false;


window.toggleMusic = function () {
    const music = document.getElementById('background-music');
    if (isPlaying) {
        music.pause();
        isPlaying = false;
    } else {
        music.play()
            .then(() => {
                isPlaying = true;
            })
            .catch((error) => {
                console.error("Ошибка при воспроизведении музыки:", error);
                alert("Не удалось воспроизвести музыку. Пожалуйста, проверьте файл.");
            });
    }
};


window.saveLetter = async function () {
    const text = document.getElementById('letter-text').value.trim();
    const author = document.getElementById('letter-author').value;
    const date = new Date().toLocaleDateString();

    if (!text) {
        alert('Напиши текст письма.');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('letters')
            .insert([{ author, text, date }]);

        if (error) {
            console.error("Ошибка при сохранении письма:", error);
            alert("Произошла ошибка при отправке письма. Попробуйте снова.");
        } else {
            alert('Письмо успешно отправлено!');
        }
    } catch (error) {
        console.error("Критическая ошибка при сохранении письма:", error);
        alert("Произошла критическая ошибка. Проверьте консоль для деталей.");
    }

    document.getElementById('letter-text').value = '';
};


async function loadLetters() {
    const list = document.getElementById('letters-list');
    list.innerHTML = '';

    try {
        const subscription = supabase
            .channel('letters')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'letters' }, (payload) => {
                const letter = payload.new;
                const div = document.createElement('div');
                div.classList.add('letter-item');
                div.innerHTML = `
                    <strong>${letter.author === 'me' ? 'Я' : 'Ты'} (${letter.date}):</strong>
                    <p>${letter.text}</p>
                `;
                list.appendChild(div);
            })
            .subscribe();
    } catch (error) {
        console.error("Ошибка при подписке на изменения писем:", error);
        alert("Не удалось загрузить письма. Проверьте консоль для деталей.");
    }
}


window.uploadPhotos = async function () {
    const input = document.getElementById('upload-photo');
    const description = document.getElementById('photo-description').value.trim();
    const files = input.files;

    if (files.length === 0) {
        alert('Выбери фото.');
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
            const { data, error } = await supabase.storage
                .from('photos')
                .upload(`${file.name}`, file);

            if (error) {
                console.error("Ошибка при загрузке фото:", error);
                alert("Не удалось загрузить фото. Попробуйте снова.");
            } else {
                const { data: urlData } = await supabase.storage
                    .from('photos')
                    .getPublicUrl(`${file.name}`);
                const publicUrl = urlData.publicUrl;

                await supabase
                    .from('photos')
                    .insert([{ src: publicUrl, description: description || 'Без описания' }]);

                alert('Фото успешно загружено!');
            }
        } catch (error) {
            console.error("Критическая ошибка при загрузке фото:", error);
            alert("Произошла критическая ошибка. Проверьте консоль для деталей.");
        }
    }

    document.getElementById('photo-description').value = '';
};


async function loadPhotos() {
    const grid = document.getElementById('photo-grid');
    grid.innerHTML = '';

    try {
        const subscription = supabase
            .channel('photos')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, (payload) => {
                const photo = payload.new;
                const photoItem = document.createElement('div');
                photoItem.classList.add('photo-item');

                const img = document.createElement('img');
                img.src = photo.src;

                const desc = document.createElement('div');
                desc.classList.add('description');
                desc.textContent = photo.description;

                photoItem.appendChild(img);
                photoItem.appendChild(desc);
                grid.appendChild(photoItem);
            })
            .subscribe();
    } catch (error) {
        console.error("Ошибка при подписке на изменения фото:", error);
        alert("Не удалось загрузить фото. Проверь консоль для деталей.");
    }
}


function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}


window.addEvent = async function () {
    const rawDate = document.getElementById('event-date').value.trim();
    const description = document.getElementById('event-description').value.trim();

    if (!rawDate || !description) {
        alert('Заполни дату и описание.');
        return;
    }

    const formattedDate = formatDate(rawDate);

    try {
        const { data, error } = await supabase
            .from('events')
            .insert([{ date: formattedDate, description }]);

        if (error) {
            console.error("Ошибка при добавлении события:", error);
            alert("Произошла ошибка при добавлении события. Попробуйте снова.");
        } else {
            alert('Событие успешно добавлено!');
        }
    } catch (error) {
        console.error("Критическая ошибка при добавлении события:", error);
        alert("Произошла критическая ошибка. Проверьте консоль для деталей.");
    }

    document.getElementById('event-date').value = '';
    document.getElementById('event-description').value = '';
};


async function loadEvents() {
    const timeline = document.getElementById('timeline-events');
    timeline.innerHTML = '';

    try {
        const subscription = supabase
            .channel('events')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
                const event = payload.new;
                const eventDiv = document.createElement('div');
                eventDiv.classList.add('event');

                const dateDiv = document.createElement('div');
                dateDiv.classList.add('date');
                dateDiv.textContent = event.date;

                const descriptionDiv = document.createElement('div');
                descriptionDiv.classList.add('description');
                descriptionDiv.textContent = event.description;

                eventDiv.appendChild(dateDiv);
                eventDiv.appendChild(descriptionDiv);
                timeline.appendChild(eventDiv);
            })
            .subscribe();
    } catch (error) {
        console.error("Ошибка при подписке на изменения событий:", error);
        alert("Не удалось загрузить события. Проверьте консоль для деталей.");
    }
}


window.onload = function () {
    AOS.init(); 
    loadLetters();
    loadPhotos();
    loadEvents();
};