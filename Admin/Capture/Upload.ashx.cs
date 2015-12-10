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
using System.Collections.Specialized;
using System.Linq;
using System.Web;
using System.IO;
using System.Web.Script.Serialization;
using System.Net;
using System.Security.Cryptography.X509Certificates;
using System.Net.Security;
using System.Configuration;

using Gov.Hhs.Cdc.Commons.Api.Key.Utils;

namespace Admin.Capture
{
    /// <summary>
    /// Summary description for Upload
    /// </summary>
    public class Upload : IHttpHandler
    {

        enum RequestMethods { POST, DELETE, PUT };

        private static WebHeaderCollection SecureHeader
        {
            get { return (WebHeaderCollection)HttpContext.Current.Session["SecureHeader"]; }
            set { HttpContext.Current.Session["SecureHeader"] = value; }
        }

        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "multipart/form-data";
            context.Response.Expires = -1;

            try
            {
                DoUpload(context); // try once;
            }
            catch (Exception)
            {
                try
                {
                    DoUpload(context); //try again;
                }
                catch (Exception ex)
                {
                    context.Response.Write("Error: " + ex.Message);
                }

            }
        }

        private static void DoUpload(HttpContext context)
        {
            string filePath = context.Request.Form["filePath"];
            int mediaid = int.Parse(context.Request.Form["mediaid"]);
            int height = int.Parse(context.Request.Form["height"]);
            int width = int.Parse(context.Request.Form["width"]);
            string type = context.Request.Form["type"];

            byte[] fileData = null;
            string fn = "";
            if (isValidURI(filePath))
            {
                //get image from url
                fn = getUriFileName(filePath);
                fileData = getImageFromUrl(filePath);
            }
            else
            {
                // get image from filepicker.
                HttpPostedFile hpf = context.Request.Files["file"] as HttpPostedFile;
                fn = hpf.FileName;
                using (var binaryReader = new BinaryReader(hpf.InputStream))
                {
                    fileData = binaryReader.ReadBytes(hpf.ContentLength);
                }
            }

            if (fileData.Length > 500000)
            {
                throw new Exception("File size is greater than .5MB and cannot be used as an alternate image.");
            }

            var store = new SerialStorage()
            {
                name = context.Request.Form["name"],
                type = context.Request.Form["type"],
                height = height,
                width = width,
                data = fileData,
                fileExtension = Path.GetExtension(fn).Trim('.'),
                mediaId = mediaid
            };

            var apiURL = context.Request.Form["apiUrl"];

            var srlzr = new JavaScriptSerializer();
            srlzr.MaxJsonLength = 50000000;
            var data = srlzr.Serialize(store);


            context.Response.StatusCode = 200;
            context.Response.Write(makeCall(ref data, apiURL, RequestMethods.POST));
        }

        private static string makeCall(ref string data, string apiUrl, RequestMethods method)
        {
            string response = string.Empty;

            WebClient webClient = new WebClient();
            webClient.Headers.Add("admin_user", HttpContext.Current.Request.LogonUserIdentity.Name);
            webClient.Headers.Add("Authorization", GetAuthorizationHeader(ref webClient, apiUrl, method.ToString(), data));

            //Used for SSL                        
            ServicePointManager.ServerCertificateValidationCallback
                += new System.Net.Security.RemoteCertificateValidationCallback(ValidateServerCertificate);

            response = webClient.UploadString(apiUrl, method.ToString(), data);

            webClient.Dispose();
            return response;
        }

        //for testing purpose only, accept any dodgy certificate... 
        public static bool ValidateServerCertificate(object sender, X509Certificate certificate, X509Chain chain, SslPolicyErrors sslPolicyErrors)
        {
            return true;
        }

        private static string GetAuthorizationHeader(ref WebClient request, string url, string method, string requestBody)
        {
            AuthorizationHeaderGenerator.KeyAgreement keyAgreement = new AuthorizationHeaderGenerator.KeyAgreement();
            keyAgreement.publicKey = ConfigurationManager.AppSettings["API_PublicKey"];
            keyAgreement.secret = ConfigurationManager.AppSettings["API_Secret"];

            AuthorizationHeaderGenerator generator = new AuthorizationHeaderGenerator("syndication_api_key", keyAgreement);

            var headers = new NameValueCollection();
            headers.Add("X-Syndication-Date", DateTime.UtcNow.ToString());
            headers.Add("Content-Type", "application/json");

            // Add headers to request
            request.Headers.Add(headers);

            headers.Add("Content-Length", requestBody.Length.ToString());
            string apiKeyHeaderValue = generator.GetApiKeyHeaderValue(headers, url, method, requestBody);

            return apiKeyHeaderValue;
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }

        private static bool isValidURI(string urlString)
        {
            Uri uri;
            if (!Uri.TryCreate(urlString, UriKind.Absolute, out uri))
                return false;
            if (uri.Scheme != Uri.UriSchemeHttp
               && uri.Scheme != Uri.UriSchemeHttps
               && uri.Scheme != Uri.UriSchemeFtp
               && uri.Scheme != Uri.UriSchemeMailto)
            {
                return false;
            }
            else
            {
                return true;
            }
        }

        private static string getUriFileName(string url)
        {
            Uri uri = new Uri(url);
            return uri.LocalPath;
        }

        private static byte[] getImageFromUrl(string url)
        {
            HttpWebRequest request = null;
            HttpWebResponse response = null;
            byte[] b = null;

            request = (HttpWebRequest)WebRequest.Create(url);
            response = (HttpWebResponse)request.GetResponse();

            if (request.HaveResponse)
            {
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    Stream receiveStream = response.GetResponseStream();
                    using (BinaryReader br = new BinaryReader(receiveStream))
                    {
                        b = br.ReadBytes(600000);
                        br.Close();
                    }
                }
            }

            return b;
        }


    }

    public class SerialStorage
    {
        public int mediaId { get; set; }
        public string name { get; set; }
        public string type { get; set; }
        public byte[] data { get; set; }
        public int height { get; set; }
        public int width { get; set; }
        public string fileExtension { get; set; }
    }
}
