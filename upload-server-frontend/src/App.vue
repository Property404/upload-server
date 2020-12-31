<template>
  <div id="app">
    <div class="head">
      <button class="emoji-shadow-button" @click="showUploadModal">📤</button>
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
      :url="fileUrl(file.id)"
      :owner="file.owner_name"
      />
    </div>
    <Modal title="Upload" ref="upload_modal" class="upload-modal">
      <template v-slot:body>
        <FileItem
        v-for="file in files_to_be_uploaded"
        @delete="removeFileCandidate(file.id)"
        :key="file.id"
        :filename="file.name"
        :size="file.size"
        :status="file.upload_status"
        :progress="file.upload_progress"
        />
      </template>
      <template v-slot:footer>
        <label for="file-upload" class="button-secondary" :data-disabled="disable_file_select">
          Select Files
          <input @change="handleFileSelect"
          style="display:none;"
          id="file-upload"
          type="file"
          :disabled="disable_file_select"
          multiple
          >
        </label>
        <button @click.prevent="upload" class="button-primary" :disabled="disable_upload_button">Upload</button>
      </template>
    </Modal>
    <Modal title="Error" ref="error_modal">
      <template v-slot:body>
        {{general_error_message}}
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
const base_url = `${location.protocol}//${location.hostname}`;
let api_base_url = base_url;
let file_base_url = base_url;
if(["localhost", "127.0.0.1"].includes(location.hostname))
{
  api_base_url += ":1234";
  file_base_url += ":1234/file";
}
else
{
  api_base_url += "/api";
  file_base_url += "/file";
}
const axios = Axios.create({
  baseURL: api_base_url,
  withCredentials: true
})

export default {
  name: 'App',
  data(){
    return{
      loading:true,
      needs_auth:false,
      login_error_message:null,
      general_error_message:null,
      disable_upload_button:true,
      disable_file_select:false,
      files_to_be_uploaded:[],
      files:[]
    }
  },
  methods:{
    fileUrl(id)
    {
      return `${file_base_url}/${id}`
    },
    showUploadModal()
    {
      this.files_to_be_uploaded = null;
      this.disable_upload_button = true;
      this.disable_file_select = false;
      this.$refs.upload_modal.show();
    },
    handleFileSelect(event){
      this.disable_upload_button = false;

      // update this way to make sure Vue refreshes
      this.files_to_be_uploaded = [];
      for(const file of event.target.files)
      {
        file.upload_status = "not-started";
        file.upload_progress = 0;
        file.id = Math.floor(Math.random()*(2**32));
        this.files_to_be_uploaded.push(file);
      }
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
      .catch(error=>{
        this.serverError(error);
      });
    },
    upload()
    {
      this.disable_upload_button = true;
      this.disable_file_select = true;

      const promises = [];
      const files = this.files_to_be_uploaded;

      for(let i=0;i<files.length;i++)
      {
        const form_data = new FormData();
        form_data.append(0, files[i], files[i].name);
        this.files_to_be_uploaded[i].upload_status = "in-progress"
        this.files_to_be_uploaded[i].owner = 3

        promises.push(
          axios.post("/upload", form_data, 
          {
           onUploadProgress:
           (progressEvent)=>{
              const percentActual = 100*progressEvent.loaded/progressEvent.total;
              const percentCompleted = Math.round((percentActual * 10))/10;

              if(percentCompleted>this.files_to_be_uploaded[i].upload_progress)
              {
                this.files_to_be_uploaded[i].upload_progress = percentCompleted;

                // Force an update
                //this.files_to_be_uploaded.push(this.files_to_be_uploaded[0]);
                this.files_to_be_uploaded.push({});
                this.files_to_be_uploaded.pop();
              }
           }
          })
          .then(result=>{
            this.files_to_be_uploaded[i].upload_status = "completed"
            this.files.push(...result.data.files);
          })
        );
      }

      Promise.all(promises)
      .then(()=>{
        this.$refs.upload_modal.hide();
      })
      .catch(error=>{
        this.disable_upload_button = false;
        this.disable_file_select = false;
        this.serverError(error);
      });
    },
    removeFileCandidate(id)
    {
      const index = this.files_to_be_uploaded.findIndex(element=>element.id==id);
      console.log(index)
      this.files_to_be_uploaded.splice(index, 1);
      console.log("Remove "+id)
    },
    deleteFile(id)
    {
      axios.post("/delete", {id}).then(()=>{
        const index = this.files.findIndex(element=>element.id==id);
        this.files.splice(index, 1);
      }).catch(error=>{
        this.serverError(error);
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
        {
          alert(err);
          this.serverError(err);
        }
      });
    },
    serverError(error)
    {
        let message = error?.response?.data
          ??error?.response
          ??error;
        message = message?.message || message;
        this.general_error_message = message;
        this.$refs.error_modal.show();
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

.file-to-be-uploaded
{
  display:block;
  background-color:var(--card-color);
  border: 1px solid grey;
  color:var(--fg-color);
  margin:.5rem;
  padding:.25rem;
  //box-shadow: 4px 4px 4px var(--card-shadow-color);
  border-radius: 10px;
  user-select:none;
  text-align:center;
  position: relative;
  color:inherit;
  text-decoration:none;
  overflow:hidden;
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

.upload-modal .modal-dialog .file-item{
  min-width:40vw;
  margin:.2rem;
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
