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
using System.Collections.Specialized;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Security;
using System.Reflection;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;
using System.Web.Services;
using System.Web.UI;
using System.Configuration;
using System.IO;

using Gov.Hhs.Cdc.Commons.Api.Key.Utils;
using System.Web.Caching;
using System.Collections;

namespace Admin
{
    public class Secure : Page
    {
        enum RequestMethods { POST, DELETE, PUT };

        private static StringBuilder sb;

        const string VALUE_SET_PREFIX = "FormattedTopicList_";

        private static WebHeaderCollection SecureHeader
        {
            get { return (WebHeaderCollection)HttpContext.Current.Session["SecureHeader"]; }
            set { HttpContext.Current.Session["SecureHeader"] = value; }
        }

        // return the version number from assembly info.
        [WebMethod(EnableSession = true)]
        public static string GetVersionNumber()
        {
            Assembly assembly = Assembly.GetExecutingAssembly();
            FileVersionInfo fvi = FileVersionInfo.GetVersionInfo(assembly.Location);
            return fvi.ProductVersion;
        }

        [WebMethod(EnableSession = true)]
        public static string SaveTerm(string data, string apiUrl)
        {
            clearTopicCache();
            return makeCall(ref data, apiUrl, RequestMethods.POST);
        }

        [WebMethod(EnableSession = true)]
        public static string UpdateTerm(string data, string apiUrl)
        {
            clearTopicCache();
            return makeCall(ref data, apiUrl, RequestMethods.PUT);
        }

        [WebMethod(EnableSession = true)]
        public static string SaveMedia(string data, string apiUrl)
        {
            return makeCall(ref data, apiUrl, RequestMethods.POST);
        }

        [WebMethod(EnableSession = true)]
        public static string updateMedia(string data, string apiUrl)
        {
            return makeCall(ref data, apiUrl, RequestMethods.PUT);
        }

        [WebMethod(EnableSession = true)]
        public static string UpdateImportFeed(string apiUrl)
        {
            string dummyData = string.Empty;
            return makeCall(ref dummyData, apiUrl, RequestMethods.PUT);
        }

        [WebMethod()]
        public static string DeleteAlternateImage(string id)
        {
            string dummyData = string.Empty;
            string apiUrl = ConfigurationManager.AppSettings["APIRoot"] + "/adminapi/v1/resources/links/" + id;
            return makeCall(ref dummyData, apiUrl, RequestMethods.DELETE);
        }


        [WebMethod()]
        public static string SaveVocab(string data, string apiURL)
        {
            return makeCall(ref data, apiURL, RequestMethods.POST);
        }

        [WebMethod()]
        public static string UpdateVocab(string data, string apiURL)
        {
            return makeCall(ref data, apiURL, RequestMethods.PUT);
        }

        [WebMethod()]
        public static string SaveThumbnail(string data, string apiURL)
        {
            return makeCall(ref data, apiURL, RequestMethods.PUT);
        }

        [WebMethod()]
        public static string ValidateUrlForType(string data, string apiURL)
        {
            return makeCall(ref data, apiURL, RequestMethods.POST);
        }

        [WebMethod()]
        public static string ValidateUrlExists(string url)
        {
            string sResponse = "";
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = "GET";
            request.Proxy = null;
            HttpWebResponse response = (HttpWebResponse)request.GetResponse();
            //return response.StatusCode.ToString();

            GetFileSize(url);

            sResponse = "{\"status\":\"" + response.StatusCode.ToString() + "\", \"contentType\":\"" + response.ContentType.ToString() + "\",\"contentLength\":\"" + response.ContentLength.ToString() + "\"}";

            response.Close();
            return sResponse;

        }

        [WebMethod()]
        public static string AddUser(string data, string apiURL)
        {
            var url = GetAPIRoot() + apiURL;
            var response = makeCall(ref data, url, RequestMethods.POST);
            return response;
        }

        [WebMethod()]
        public static string SetRoles(string data, string apiURL)
        {
            return makeCall(ref data, apiURL, RequestMethods.POST);
        }

        [WebMethod()]
        public static string GetCurrentUserInfo(string apiURL)
        {
            var root = GetAPIRoot(); //"https://.....[devReportingApplicationServer2]...../adminapi";
            var currentUser = HttpContext.Current.Request.LogonUserIdentity.Name;
            if (currentUser.StartsWith("CDC\\"))
            {
                currentUser = currentUser.Substring(4);
            }
            var url = root + apiURL.Replace("adminusers/", "adminusers/" + currentUser);
            return makeCall(url);
        }

        [WebMethod()]
        public static string GetSingleUserInfo(string apiURL)
        {
            var root = GetAPIRoot();
            var url = root + apiURL;
            return makeCall(url);
        }

        [WebMethod()]
        public static string CreateProxyCache(string data, string apiUrl)
        {
            return makeCall(ref data, apiUrl, RequestMethods.POST);
        }

        [WebMethod()]
        public static string UpdateProxyCache(string data, string apiUrl)
        {
            return makeCall(ref data, apiUrl, RequestMethods.PUT);
        }

        [WebMethod()]
        public static string DeleteProxyCache(string data, string apiUrl)
        {
            return makeCall(ref data, apiUrl, RequestMethods.DELETE);
        }

        [WebMethod()]
        public static string CreateProxyCacheAppKey(string data, string apiUrl)
        {
            return makeCall(ref data, apiUrl, RequestMethods.POST);
        }

        [WebMethod()]
        public static string UpdateProxyCacheAppKey(string data, string apiUrl)
        {
            return makeCall(ref data, apiUrl, RequestMethods.PUT);
        }

        [WebMethod()]
        public static string DeleteProxyCacheAppKey(string data, string apiUrl)
        {
            return makeCall(ref data, apiUrl, RequestMethods.DELETE);
        }

        private class AuthUser
        {
            public string name { get; set; }
            public string userName { get; set; }
            public List<string> roles { get; set; }
            public string mediaSet
            {
                get
                {
                    if (name == "Media Admin") { return "All Media"; }
                    else { return "N/A"; }
                }
            }
        }

        [WebMethod()] //temporary -- move logic to API
        public static string UsersByRole(string apiURL)
        {
            var url = GetAPIRoot() + apiURL; //roles endpoint

            var jss = new JavaScriptSerializer();
            var roles = Roles(url);

            var result = jss.Serialize(roles);
            return result;
        }

        private static SerialResponseWithType<List<SerialAdminRole>> Roles(string apiURL)
        {
            var url = apiURL; //roles endpoint

            var jss = new JavaScriptSerializer();
            var roles = jss.Deserialize<SerialResponseWithType<List<SerialAdminRole>>>(makeCall(url));
            return roles;
        }

        [WebMethod()]
        public static string AvailableUsersForRole(string apiURL)
        {
            var url = GetAPIRoot() + apiURL; //adminusers endpoint
            var rolesEndpoint = url.Replace("adminusers", "roles");

            var roles = Roles(rolesEndpoint).results;

            var jss = new JavaScriptSerializer();
            var apiOutput = jss.Deserialize<SerialResponseWithType<List<SerialAdminUser>>>(makeCall(url));

            ClearMembers(roles);

            foreach (var item in apiOutput.results)
            {
                foreach (var role in roles)
                {
                    if (!item.Roles.Any(r => r == role.name))
                    {
                        role.members.Add(item);
                    }
                }
            }

            var result = jss.Serialize(roles);
            return result;

        }

        private static void ClearMembers(List<SerialAdminRole> roles)
        {
            foreach (var role in roles)
            {
                role.members = new List<SerialAdminUser>();
            }
        }

        [WebMethod()]
        public static string RolesByUser(string apiURL)
        {
            var url = GetAPIRoot() + apiURL;
            var users = new List<AuthUser>();
            var jss = new JavaScriptSerializer();
            var apiOutput = jss.Deserialize<SerialResponseWithType<List<SerialAdminUser>>>(makeCall(url));
            foreach (var item in apiOutput.results)
            {
                var existing = users.Where(u => u.name == item.UserName);
                if (existing.Count() == 0)
                {
                    users.Add(new AuthUser { name = item.Name, userName = item.UserName, roles = item.Roles });
                }
                else
                {
                    existing.First().roles.AddRange(item.Roles);
                }
            }

            return jss.Serialize(users);
        }



        /*
            <add key="APIRoot" value="https://.....[devApiServer]....." />
            <add key="PublicAPIRoot" value="https://.....[devApiServer]....." />
            <add key="WebFolder" value="medialibraryadmin"/>
            <add key="WebRoot" value="" />
        */

        [WebMethod()]
        public static string GetAPIRoot() { return ConfigurationManager.AppSettings["APIRoot"]; }

        //[WebMethod()]
        //public static string GetPublicAPIRoot() { return ConfigurationManager.AppSettings["PublicAPIRoot"]; }

        //[WebMethod()]
        //public static string GetWebFolder() { return ConfigurationManager.AppSettings["WebFolder"]; }

        //[WebMethod()]
        //public static string GetPublicWebRoot() { return ConfigurationManager.AppSettings["PublicWebRoot"]; }

        //[WebMethod()]
        //public static string GetFormAuthentication() { return ConfigurationManager.AppSettings["FormAuthentication"]; }

        [WebMethod()]
        public static string GetConfigValues()
        {
            var jss = new JavaScriptSerializer();
            ConfigValues cv = new ConfigValues
            {
                APIRoot = ConfigurationManager.AppSettings["APIRoot"],
                PublicAPIRoot = ConfigurationManager.AppSettings["PublicAPIRoot"],
                PublicWebRoot = ConfigurationManager.AppSettings["PublicWebRoot"],
                FormAuthentication = bool.Parse(ConfigurationManager.AppSettings["FormAuthentication"]),
                FeedCategoryValueSetId = int.Parse(ConfigurationManager.AppSettings["FeedCategoryValueSetId"])
            };

            return jss.Serialize(cv);
        }


        [WebMethod()]
        public static string GetFileSize(string url)
        {
            var request = WebRequest.Create(url);
            using (var response = request.GetResponse()) {
                return response.ContentLength.ToString();
            }                
        }


        [WebMethod()]
        public static string GetPDFPageCount(string url)
        {
            string html = "";
            string pageCount = "0";
            var request = WebRequest.Create(url);
            using (var response = request.GetResponse())
            {
                html = new StreamReader(response.GetResponseStream()).ReadToEnd();

                int valIndexStart = html.IndexOf("numPages:");
                if (valIndexStart != -1)
                {
                    valIndexStart += 9;

                    int valIndexEnd = html.IndexOf(",", valIndexStart);
                    if (valIndexEnd != -1)
                    {
                        pageCount = html.Substring(valIndexStart, valIndexEnd - valIndexStart);
                    }
                }

            }
            return pageCount;
        }

        [WebMethod()]
        public static string GetFeedCategories(string apiURL)
        {

            object FeedCategories = HttpContext.Current.Cache["FeedCategories"] as string;

            if (FeedCategories == null)
            {
                FeedCategories = makeCall(apiURL);
                HttpContext.Current.Cache.Add("FeedCategories", FeedCategories, null, DateTime.Now.AddSeconds(30),
                Cache.NoSlidingExpiration, CacheItemPriority.Normal, null);
            }

            return FeedCategories.ToString();
        }

        [WebMethod()]
        public static string GetTopicList(string apiURL)
        {

            var queryString = apiURL.Substring(apiURL.IndexOf('?')).Split('#')[0];
            var id = HttpUtility.ParseQueryString(queryString).Get("id");
            var valueSetName = HttpUtility.ParseQueryString(queryString).Get("valueset");
            var language = HttpUtility.ParseQueryString(queryString).Get("language");

            string cacheName = VALUE_SET_PREFIX + (id != null ? id : valueSetName);
            cacheName += language != null ? language : "";

            object FormattedTopicList = HttpContext.Current.Cache[cacheName] as string;

            if (FormattedTopicList == null)
            {

                var jss = new JavaScriptSerializer();
                var apiOutput = jss.Deserialize<SerialResponseWithType<List<SerialValueItemAdmin>>>(makeCall(apiURL));
                var results = apiOutput.results;
                apiOutput.results = results;
                sb = new StringBuilder();

                sb.Append("<ul>");

                apiOutput.results.Where(a => !a.relationships.Any(r => r.type == "NT"))
                    .ToList()
                    .ForEach(c => CreateTree(c, apiOutput.results, true));

                sb.Append("</ul>");

                apiOutput.html = sb.ToString();

                FormattedTopicList = jss.Serialize(apiOutput);
                HttpContext.Current.Cache.Add(cacheName, FormattedTopicList, null, DateTime.Now.AddSeconds(300),
                    Cache.NoSlidingExpiration, CacheItemPriority.Normal, null);
            }

            return FormattedTopicList.ToString();
        }

        private static void CreateTree(SerialValueItemAdmin item, List<SerialValueItemAdmin> allItems, bool flagAsRoot)
        {

            string inactiveClass = "";
            if (!item.isActive)
            {
                inactiveClass = "inactive";
            }

            string rootNodeMarker = "";
            if (flagAsRoot) { rootNodeMarker = "treeRootNode"; }

            sb.Append("<li itemid='" + item.valueId + "' class='" + rootNodeMarker + " " + inactiveClass + "'><a title='" + item.valueName + "' class='btn btn-default' data-toggle='modal' termid='" + item.valueId + "'>" + item.valueName + "</a>");
            var children = allItems.Where(itm => itm.relationships.Any(r => r.type == "NT" && r.relatedValueId == item.valueId))
                .ToList();

            if (children.Count() > 0)
            {
                sb.Append("<ul>");
                children.ForEach(c => CreateTree(c, allItems, false));
                sb.Append("</ul>");
            }

            sb.Append("</li>");
        }

        public sealed class SerialMeta
        {
            public int status { get; set; }
        }


        public sealed class SerialResponseWithType<T>
        {
            public SerialMeta meta { get; set; }

            public T results { get; set; }
            public string html { get; set; }
        }


        private class SerialValueItemAdmin
        {
            public int valueId { get; set; }
            public string valueName { get; set; }
            public string languageCode { get; set; }
            public string description { get; set; }
            public int displayOrdinal { get; set; }
            public bool isActive { get; set; }
            public IEnumerable<SerialVocabularyRelation> relationships { get; set; }
            public IEnumerable<SerialValueItemAdmin> children { get; set; }
        }

        private class SerialVocabularyRelation
        {
            public int valueId { get; set; }
            public string type { get; set; }
            public string description { get; set; }
            public int relatedValueId { get; set; }
            public string relatedValueLanguageCode { get; set; }
            public string relatedValueName { get; set; }
        }

        public class SerialAdminRole
        {
            public string name { get; set; }
            public List<SerialAdminUser> members { get; set; }
            public string mediaSet
            {
                get
                {
                    if (name == "Media Admin") { return "All Media"; }
                    else { return "N/A"; }
                }
            }
 
        }

        public class SerialAdminUser
        {
            public string Name { get; set; }
            public string UserName { get; set; }
            public string DisplayName
            {
                get
                {
                    var userId = UserName;
                    if (userId.StartsWith("CDC\\"))
                    {
                        userId = userId.Substring(4);
                    }
                    return Name + " (" + userId + ")";
                }
            }
            public string Email { get; set; }
            public Guid UserGuid { get; set; }
            public List<string> Roles { get; set; }
        }

        public class ConfigValues
        {
            public string APIRoot { get; set; }
            public string PublicAPIRoot { get; set; }
            public string PublicWebRoot { get; set; }
            public bool FormAuthentication { get; set; }
            public int FeedCategoryValueSetId { get; set; }
            public int FeedSubCategoryValueSetId { get; set; }
        }

        private static string makeCall(string apiUrl)
        {
            var uri = new Uri(apiUrl);

            string response = string.Empty;
            var webClient = new WebClient();
            webClient.Encoding = System.Text.Encoding.UTF8;

            webClient.Headers.Add("admin_user", HttpContext.Current.Request.LogonUserIdentity.Name);

            //Used for SSL
            ServicePointManager.ServerCertificateValidationCallback
                += new RemoteCertificateValidationCallback(ValidateServerCertificate);

            response = webClient.DownloadString(uri);
            SecureHeader = webClient.ResponseHeaders;

            webClient.Dispose();
            return response;
        }

        private static string makeCall(ref string data, string apiUrl, RequestMethods method)
        {
            //data = data.Replace("\\u0027", "'");

            string response = string.Empty;
            var webClient = new WebClient();            
            webClient.Encoding = System.Text.Encoding.UTF8;
            //webClient.Headers.Add("admin_user", HttpContext.Current.User.Identity.Name);
            webClient.Headers.Add("admin_user", HttpContext.Current.Request.LogonUserIdentity.Name);
            webClient.Headers.Add("Authorization", GetAuthorizationHeader(ref webClient, apiUrl, method.ToString(), data));

            //Used for SSL
            ServicePointManager.ServerCertificateValidationCallback
                += new RemoteCertificateValidationCallback(ValidateServerCertificate);

            try
            {
                response = webClient.UploadString(apiUrl, method.ToString(), data);
            }
            catch (WebException wex)
            {
                if(wex.Message == "The operation has timed out"){
                    response = "{\"meta\":{\"status\":408,\"message\":[],\"resultSet\":{},\"pagination\":{\"total\":0,\"count\":0,\"max\":0,\"offset\":0,\"pageNum\":0,\"totalPages\":0,\"sort\":\"-datepublished,mediaid\",\"previousUrl\":\"\",\"currentUrl\":\"\",\"nextUrl\":\"\"}},\"results\":[   ]}";
                }
            }
            SecureHeader = webClient.ResponseHeaders;
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


        private static void clearTopicCache()
        {
            HttpContext oc = HttpContext.Current;
            foreach (var c in oc.Cache)
            {
                string cacheName = ((DictionaryEntry)c).Key.ToString();
                if (cacheName.IndexOf(VALUE_SET_PREFIX) > -1)
                {
                    oc.Cache.Remove(cacheName);
                }
            }
        }
    }
}
