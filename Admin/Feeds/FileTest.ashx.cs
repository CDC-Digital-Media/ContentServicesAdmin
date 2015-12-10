// Copyright [2015] [Centers for Disease Control and Prevention] 
// Licensed under the CDC Custom Open Source License 1 (the 'License'); 
// you may not use this file except in compliance with the License. 
// You may obtain a copy of the License at
// 
//   http://t.cdc.gov/O4O
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;

namespace Admin.Feeds
{
    /// <summary>
    /// Summary description for FileTest
    /// </summary>
    public class FileTest : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "multipart/form-data";
            context.Response.Expires = -1;

            try
            {

                HttpPostedFile hpf = context.Request.Files["file"] as HttpPostedFile;
                string fn = hpf.FileName;
                byte[] fileData = null;
                using (var binaryReader = new BinaryReader(hpf.InputStream))
                {
                    fileData = binaryReader.ReadBytes(hpf.ContentLength);
                }

                if (fileData.Length > 500000)
                {
                    throw new Exception("File size is greater than .5MB and cannot be used as an alternate image.");
                }

                var ms = new System.IO.MemoryStream(fileData);

                System.Drawing.Image image = System.Drawing.Image.FromStream(ms);
                string baseStr64 = Convert.ToBase64String(ms.ToArray());

                imgFile imgF = new imgFile(image.Width, image.Height, baseStr64);

                var serializer = new JavaScriptSerializer();
                var serializedResult = serializer.Serialize(imgF);

                context.Response.StatusCode = 200;
                context.Response.Write(serializedResult);
                
                ms.Dispose();                
            }

            catch (Exception ex)
            {

                context.Response.Write("Error: " + ex.Message);

            }
        }

        protected class imgFile {
            public int width { get; set; }
            public int height { get; set; }
            public string byteString { get; set; }

            public imgFile(int w, int h, string bs) {
                this.width = w;
                this.height = h;
                this.byteString = bs;
            }
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}
