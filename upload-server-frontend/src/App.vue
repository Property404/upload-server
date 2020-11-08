<template>
  <div id="app">
    <div class="head">
      <button class="emoji-shadow-button" @click="$refs.upload_modal.show">📤</button>
      <button class="emoji-shadow-button" @click="logout">exit</button>
    </div>
    <div class="file-items">
      <FileItem
      v-for="file in files"
      :key="file.id"
      @delete="deleteFile(file.id)"
      class="file-item"
      :filename="file.name"
      :size="file.size"
      :url="file.id"
      :owner="file.owner_name"
      />
    </div>
    <Modal title="Upload" ref="upload_modal">
      <template v-slot:body>
        {{new_filename}}
      </template>
      <template v-slot:footer>
        <label for="file-upload" class="button-secondary">
          Select File
          <input @change="handleFileSelect" style="display:none;" id="file-upload" type="file" class="button-secondary">
        </label>
        <button @click.prevent="upload" class="button-primary">Upload</button>
      </template>
    </Modal>
    <div v-if="loading" id="entry-backdrop">
    </div>
    <div id="login-screen" v-if="needs_auth">
      <form>
        <h1>Please Sign In</h1>
        <div v-show="login_error_message">{{login_error_message}}</div>
        <input id="username-input" ref="username_input" type="text" autofocus/>
        <input id="password-input" type="password" required/>
        <button @click.prevent="login" class="button-primary" type="submit">Submit</button>
      </form>
    </div>
  </div>
</template>

<script>
import FileItem from './components/FileItem.vue'
import Modal from './components/Modal.vue'
import Axios from "axios";

// For local testing, use separate port
// When deployed, API is behind reverse proxy on route /api
const base_url = `${location.protocol}//${location.hostname}`+
  (["localhost","127.0.0.1"].includes(location.hostname)?":1234":"/api");
const axios = Axios.create({
  baseURL: base_url,
  withCredentials: true
})

export default {
  name: 'App',
  data(){
    return{
      loading:true,
      needs_auth:false,
      new_filename: null,
      login_error_message:null,
      files:[]
    }
  },
  methods:{
    handleFileSelect(event){
      this.new_filename = event.target.value.replace("C:\\fakepath\\","");
    },
    login()
    {
      const username = document.getElementById("username-input").value;
      const password = document.getElementById("password-input").value;
      axios.post("/authenticate",{username, password})
      .then(()=>{
        this.fetchFileList();
        this.needs_auth = false;
        this.loading = false;
      })
      .catch(err=>{
        const message = err.response?.data?.message || err;
        console.log(err.response);
        this.login_error_message = message;
      });
    },
    logout()
    {
      axios.post("/logout")
      .then(()=>{
        this.files.length = 0;
        this.needs_auth = true;
        this.$nextTick(()=>this.$refs.username_input.focus());
        this.loading = true;
      })
      .catch(err=>{
        const message = err.response?.data?.message || err;
        console.log(err.response);
        this.login_error_message = message;
      });
    },
    upload()
    {
      const files = document.getElementById("file-upload").files;
      const form_data = new FormData();
      for(let i=0;i<files.length;i++)
      {
        form_data.append(i, files[i], files[i].name);
      }
      axios.post("/upload", form_data)
      .then(result=>{
        this.files.push(result.data.file);
      })
      .catch(error=>{
        console.log("Upload error: ", error.response.data)
      });
    },
    deleteFile(id)
    {
      axios.post("/delete", {id}).then(()=>{
        const index = this.files.findIndex(element=>element.id==id);
        this.files.splice(index, 1);
      }).catch(error=>{
        alert(error);
      })
    },
    fetchFileList()
    {
      axios.get("/files")
      .then(response=>{
        this.loading = false;
        this.needs_auth = false;
        this.files = response.data.files;
      })
      .catch(err=>{
        // We're not logged in
        if(err.response?.status === 403)
        {
          this.needs_auth = true;
          this.$nextTick(()=>this.$refs.username_input.focus());
        }
        else
          alert(err.response?.data || err)
      });
    }
  },
  beforeMount()
  {
    this.fetchFileList();
  },
  mounted(){
  },
  components: {
    FileItem,
    Modal
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: var(--fg-color);
  background-color: inherit;
  width:100%;
  height:100%;
  display:flex;
  flex-direction:column;
  align-items:center;
}
.head{
  margin:0;
  padding:0;
  background-color:inherit;
  position:sticky;
  top:0;
  width:100%;
  display:flex;
  justify-content:flex-end;
  z-index:1;
  button{
    margin: .15rem;
  }
}

.file-items{
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  margin-top:.25rem;
  width:97%;
  .file-item{
    margin-bottom:.35rem;
  }
}

.fullscreen{
  position:fixed;
  top:0;
  left:0;
  width:100%;
  height:100%;
}
#entry-backdrop{
  @extend .fullscreen;
  background-color:var(--bg-color);
  z-index:300;
}
#login-screen{
  @extend .fullscreen;
  color:var(--fg-color);
  z-index:400;
  display:flex;
  justify-content:center;
  align-items:center;
  form{
    display:flex;
    flex-direction:column;
    h1{
      margin-bottom:.5rem;
    }
    input{
      padding:.5rem;
    }
    button{
      margin-top:.5rem;
      padding:.5rem;
    }
  }
}
.emoji-shadow-button
{
  background-color:transparent;
  border:none;
  color:transparent;
  text-shadow: 0px 0px var(--secondary-fg-color);
  cursor:pointer;
  &:hover{
    text-shadow:0px 0px var(--fg-color);
  }
}
@media (min-width:1200px)
{
  .head{
    max-width:50%;
  }
  .file-items{
    max-width:50%;
  }
}
</style>
