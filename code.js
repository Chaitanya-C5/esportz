let isValid = true;
let count = 0;
function validateForm()
{
    isValid = true;
    count = 0;

    if(isValid) validateUsername();

    if(isValid) { count ++; validateEmail(); }

    if(isValid) { count ++; validatePassword();}
        
    if(isValid) { count ++; validateConfirmPassword();}

    if(isValid) { count ++; validatePhoneNumber();}

    if(isValid) { count ++; isRoleRadioButtonSelected();}

    if(isValid) { count ++; validateAge();}

    if(isValid) { count ++; isGenderRadioButtonSelected(); }

    if(isValid) count ++;   

}
async function validateUsername() 
{
    var username = document.form1.name.value;
    username = username.trim();
    if (username === "") 
    {
        alert("Username can't be blank");
        isValid =  false;
        return ;
    }
    if(username.length < 5 || username.length >100)
    {
        alert("Username min length should be 5 and max length should be 100");
        isValid =  false;
        return ;
    }
    var regex = /^[a-zA-Z_]+$/;
    if (!regex.test(username)) 
    {
        alert("Username should only consist of letters and underscores");
        isValid =  false;
        return ;
    } 
    
    const data = {uname : username};
    isValid = await checkDB(data);   
}

async function checkDB(data) 
{
    try 
    {
        const response = await fetch('/checkDB', 
        {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    
        const result = await response.json();
    
        if (result.message === 'true') {
            alert('Username already exists');
            return false;
        } 
        else 
        {
            return true;
        }
    } 
    catch (error) {
      console.log(error);
    }
  }

function validatePassword() 
{
    var password = document.form1.password.value;
    password = password.trim();

    if (password.length < 5 || password.length > 20) 
    {
        alert("Password minimum length should be 5 and maximum length can be 20");
        isValid =  false;
    } 
}

function validateConfirmPassword() 
{
    var password = document.form1.cpassword.value;
    var confirmPassword = document.form1.scpwd.value;
    password = password.trim();
    confirmPassword = confirmPassword.trim();

    if (!(password === confirmPassword) || password === '') 
    {
        alert("Password and Confirm password should be same");
        isValid =  false;
    } 
}

function validateEmail() 
{
    var email = document.form1.email.value;
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email === '') 
    {
        alert("Email Invalid");
        isValid =  false;
    } 
}

function validatePhoneNumber() 
{
    var phoneNumber = document.form1.phone.value;
    var phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber) || phoneNumber === '') 
    {
        alert("Phone number is INVALID!!!")
        isValid =  false;
    } 
}

function isRoleRadioButtonSelected() 
{
    var radioButton1 = document.getElementById('ssradio');
    
    var radioButton2 = document.getElementById('scradio');

    if (!radioButton1.checked && !radioButton2.checked) 
    {
        alert("Select atleast one radio button");
        isValid = false;
    } 
}

function validateAge() 
{
    var age = document.form2.age.value;
    if (age == "") 
    {
        alert("Age should not be empty");
        isValid = false;
    }
    if (isNaN(age)) 
    {
        alert("Age should be a number.");
        isValid = false;
    }
    if (age < 5 || age > 120) 
    {
        alert("Age should be between 5 and 120.");
        isValid = false;
    }
}

function isGenderRadioButtonSelected() 
{
    var radioButton1 = document.getElementById('smradio');
    
    var radioButton2 = document.getElementById('sfradio');

    if (!radioButton1.checked && !radioButton2.checked) 
    {
        alert("Select atleast one radio button");
        isValid = false;
    } 
   
}
const submitBtn = document.getElementById('submit');

submitBtn.addEventListener('click', function() {
    const data = {
        name: document.form1.name.value,
        email: document.form1.email.value,
        password: document.form1.password.value,
        cpassword: document.form1.cpassword.value,
        phone: document.form1.phone.value,
        role: document.form2.role.value,
        age: document.form2.age.value,
        gender: document.form2.gender.value,
        country: document.form2.country.value,
        favouriteSport: document.form2.favouriteSport.value
    };
   
    validateForm();

      if(count == 8)
      {
        if(isValid) 
            {
                fetch('/submit-form', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Form data submitted successfully');


                        Email.send({
                            Host : "smtp.elasticemail.com",
                            Username : "gellachaitanyavenkatasai@gmail.com",
                            Password : "AF3CEC532F9670F7247E76446040AF504E1D",
                            To : data.message,
                            From : "gellachaitanyavenkatasai@gmail.com",
                            Subject : "Successful SIGNUP",
                            Body : "Welcome to E-SPORTZ now you are one of our team member..."
                        })
                        
                        setTimeout(function() {
                            window.location.href = "./login_page.html";
                          }, 5000);
                        
                })
                .catch(error => {
                    console.error(error);
                });

                
                
            }
      }
      
    
});