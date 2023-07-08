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
    if (fileSize > 15) {
      event.preventDefault(); // prevent form submission
      alert('The file size exceeds the maximum limit of 15 MB.');
    }
    else
    {
        const formData = new FormData(form);
    
        fetch('/upload', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
            //console.log(data+"\n"+data.flag);

            const mails = data.emails;
            mails.forEach(email => {
              Email.send({
                        Host : "smtp.elasticemail.com",
                        Username : "gellachaitanyavenkatasai@gmail.com",
                        Password : "AF3CEC532F9670F7247E76446040AF504E1D",
                        To : email,
                        From : "gellachaitanyavenkatasai@gmail.com",
                        Subject : "New video uploaded",
                        Body : data.uname +": Hello user new video uploaded please checkout esportz"
                    });
            });
            alert("Video Uploaded Successfully!");
                
        })
        .catch(error => {
          console.error('Error uploading video:', error);
          //alert('Error uploading video!');
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
    document.getElementById('reply-container').style.display = 'none';
  });



function showHome()
{
  document.getElementById('homeside').style.display = "flex";
  document.getElementById('video-container').style.display = "none";
  document.getElementById('reply-container').style.display = 'none';
}

function showDoubts()
{
  document.getElementById('homeside').style.display = "none";
  document.getElementById('video-container').style.display = "none";
  document.getElementById('reply-container').style.display = 'flex';

  fetch('/showdoubts',{
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);

      for(var i=0;i<data.length;i++) 
      {
        const box = document.createElement('div');
        box.classList.add("boxer");

        const doubtHeading = document.createElement('h1');
        doubtHeading.innerHTML = "#Doubt "+(i+1);

        const st_name = document.createElement('h3');
        st_name.innerHTML = "by_"+data[i].stud_username;
        st_name.style.fontStyle = "italic";
        st_name.style.marginTop = "20px";
        st_name.style.marginRight = "15px"

        const sub = document.createElement("div");
        sub.appendChild(doubtHeading);
        sub.appendChild(st_name);

        sub.style.display = "flex";
        sub.style.justifyContent = "space-between";

        box.appendChild(sub);

        const doubt = document.createElement('p');
        doubt.innerHTML = data[i].message;
        box.appendChild(doubt);

        const hide = document.createElement("div");

        const textarea = document.createElement("textarea");
        textarea.rows = 8;
        textarea.cols = 50;
        hide.appendChild(textarea);

        textarea.addEventListener("click",(event) => {
          event.stopPropagation();
        });
  
        const sendBtn = document.createElement("button");
        sendBtn.innerHTML = "Reply";
        sendBtn.setAttribute("msg-id", data[i].No);
        hide.appendChild(sendBtn);

        sendBtn.addEventListener("click",(event) => {
          event.stopPropagation();
        });

        sendBtn.addEventListener("click",(event) => {
          const msg = {
            id: event.target.getAttribute("msg-id"),
            stud: st_name.innerHTML.slice(3),
            msg: textarea.value
          };

          fetch("/sendReply",{
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(msg) 
          })
          .then(response => response.json())
          .catch(error => {
            console.error("Error sending message:", error);
          });

          alert("Reply Sent");
        });

        hide.style.display = "none";
        hide.style.flexDirection = "column";
        hide.style.gap = "15px";
        hide.style.justifyContent = "center";
        hide.style.alignItems = "center";
        box.appendChild(hide);

        box.addEventListener('click', function() {
          hide.style.display = hide.style.display === "none" ? "flex" : "none";
        });

        var container = document.getElementById("reply-container");
        container.appendChild(box);

        
      }

    })
    .catch(error => {
      console.error(error);
    })
 
}

