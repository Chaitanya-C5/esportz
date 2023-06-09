var modal = document.getElementById("upload-modal");

function videoUpload()
{
    modal.style.display = "block";
}

var span = document.getElementsByClassName("close")[0];
span.onclick = function() {
  modal.style.display = "none";
}

const fileInput = document.querySelector('input[type=file]');

var form = document.getElementById("upload-form");
form.addEventListener("submit", function(event) {
  event.preventDefault();

  const fileSize = fileInput.files[0].size / 1024 / 1024; // in MB
    if (fileSize > 10) {
      event.preventDefault(); // prevent form submission
      alert('The file size exceeds the maximum limit of 10 MB.');
    }
    else
    {
        const formData = new FormData(form);
    
        fetch('/upload', {
          method: 'POST',
          body: formData
        })
        .then(response => {
          if (response.ok) 
          {
            // Video uploaded successfully
            alert("Video uploaded successfully!");

              Email.send({
                Host : "smtp.elasticemail.com",
                Username : "gellachaitanyavenkatasai@gmail.com",
                Password : "AF3CEC532F9670F7247E76446040AF504E1D",
                To : data.message,
                From : "gellachaitanyavenkatasai@gmail.com",
                Subject : "New video uploaded",
                Body : ""
            });
            modal.style.display = "none";
          } 
          else 
          {
            // Error uploading video
            alert('Error uploading video!');
          }
        })
        .catch(error => {
          console.error('Error uploading video:', error);
          alert('Error uploading video!');
        });
    }
});


  const myVideosBtn = document.getElementById('my-videos-btn');
  const videoContainer = document.getElementById('video-container');
  
  myVideosBtn.addEventListener('click', () =>  {
    fetch('/myvideos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(videos => {
        videoContainer.innerHTML = '';
        videos.forEach(video => {
          const videoDiv = document.createElement('div');
          
          const titleHeading = document.createElement('h3');
          titleHeading.textContent = video.title;
          titleHeading.style.display = "inline";
          videoDiv.appendChild(titleHeading);
          
          const descParagraph = document.createElement('p');
          descParagraph.textContent = video.description;
          descParagraph.style.display = "inline";
          videoDiv.appendChild(descParagraph);

          const videoElement = document.createElement('video');
          videoElement.src = video.url; 
          videoElement.width = '540';
          videoElement.height = '360';
          videoElement.autoplay = false; 
          videoElement.controls = true; 
          videoDiv.appendChild(videoElement);
          videoDiv.style.width = "600";
          videoDiv.style.display = "flex";
          videoDiv.style.flexDirection = "column";
          videoContainer.appendChild(videoDiv);
            
        });
      })
      .catch(error => {
        console.error('Error retrieving videos:', error);
      });

    document.getElementById('homeside').style.display = "none";
    document.getElementById('video-container').style.display = "flex";
  });



function showHome()
{
  document.getElementById('homeside').style.display = "flex";
  document.getElementById('video-container').style.display = "none";
}

var profile = document.getElementById("profile");