import { HttpHeaders, HttpResponse } from '@angular/common/http';

import { IAsset, TObjectId } from '../../core/interfaces/common.interface';
import { IProcess } from '../../core/interfaces/process.interface';
import { IDCProject, IDCProjectFile, IDCProjectSessionCreate } from '../../develop/dc-project.interfaces';
import { IPackage } from '../../develop/package.interfaces';
import { IFixtureServiceRoute } from '../fixture.interface';
import { doRealFirst } from '../fixture.utils';

export const dcProjectsRoutes: IFixtureServiceRoute[] = doRealFirst([
  {
    url: 'dc-projects$',
    method: 'GET',
    handler: function (this, params, user) {
      return this.serveAssetListRequest(this.collections.dcProjects, IAsset.Type.DC_PROJECT, params, user);
    },
  },
  {
    url: 'dc-projects/([\\w\\-]+)$',
    method: 'GET',
    handler: function(this, params, user) {
      const id = params[1];
      const dcProjects = this.collections.dcProjects;
      const dcProject = dcProjects.findOne({id: id, ownerId: user.id});

      if (!dcProject) {
        throw new Error('Project Not found');
      }

      return dcProject;
    },
  },
  {
    url: 'dc-projects/([\\w\\-]+)/files/(.+)$',
    method: 'GET',
    handler: function(this, params, user) {
      const projectId = params[1];
      const filePath = params[2];
      const dcProjects = this.collections.dcProjects;
      const dcProject = dcProjects.findOne({id: projectId, ownerId: user.id});

      if (!dcProject) {
        throw new Error('Project Not found');
      }

      return new HttpResponse<string>({
        body: `from ${filePath} import fn`,
        headers: new HttpHeaders({
          'Last-Modified': new Date().toUTCString(),
        }),
      });
    },
  },
  {
    url: 'dc-projects/([\\w\\-]+)/files/(.+)$',
    method: 'PUT',
    handler: function(this, params, user) {
      const projectId = params[1];
      const filePath = params[2];
      const dcProjects = this.collections.dcProjects;
      const dcProject = dcProjects.findOne({id: projectId, ownerId: user.id});

      if (!dcProject) {
        throw new Error('Project Not found');
      }

      return {
        type: IDCProjectFile.Type.FILE,
        name: filePath,
        modified: new Date().toISOString(),
      };
    },
  },
  {
    url: 'dc-projects/([\\w\\-]+)/files/(.+)$',
    method: 'DELETE',
    handler: function(this, params, user) {
      const projectId = params[1];
      const dcProjects = this.collections.dcProjects;
      const dcProject = dcProjects.findOne({id: projectId, ownerId: user.id});

      if (!dcProject) {
        throw new Error('Project Not found');
      }

      return 'OK';
    },
  },
  {
    url: 'dc-projects/([\\w\\-]+)/ls$',
    method: 'GET',
    handler: function(this, params, user) {
      const projectId = params[1];
      const path = params['path'];
      const dcProjects = this.collections.dcProjects;
      const dcProject = dcProjects.findOne({id: projectId, ownerId: user.id});

      if (!dcProject) {
        throw new Error('Project Not found');
      }

      const data: IDCProjectFile[] = [
        {type: IDCProjectFile.Type.DIR, name: 'foo', modified: '2018-01-01T23:00:00Z'},
        {type: IDCProjectFile.Type.FILE, name: 'foo/bar.py', modified: '2018-01-01T23:00:00Z'},
        {type: IDCProjectFile.Type.FILE, name: 'foo/bar.js', modified: '2018-01-01T23:00:00Z'},
        {type: IDCProjectFile.Type.FILE, name: 'foo/bar.scala', modified: '2018-01-01T23:00:00Z'},
        {type: IDCProjectFile.Type.FILE, name: 'foo/bar.java', modified: '2018-01-01T23:00:00Z'},
        {type: IDCProjectFile.Type.FILE, name: 'foo/bar.sh', modified: '2018-01-01T23:00:00Z'},
        {type: IDCProjectFile.Type.DIR, name: 'folder', modified: '2018-01-01T23:00:00Z'},
      ];

      return path
        ? data.filter(_ => _.name.startsWith(path))
        : data;
    },
  },
  {
    url: 'dc-projects$',
    method: 'POST',
    handler: function (this, params, user) {
      const dcProjects = this.collections.dcProjects;

      const newDcProject = Object.assign(
        {
          id: Date.now().toString(),
          name: null,
          description: null,
          ownerId: user.id,
          status: IDCProject.Status.IDLE,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
        params,
      );

      return dcProjects.insertOne(newDcProject);
    },
  },
  {
    url: 'dc-projects/([\\w\\-]+)$',
    method: 'PUT',
    handler: function (this, params, user) {
      const id = params[1];
      const models = this.collections.dcProjects;
      const model = models.findOne({id: id, ownerId: user.id});
      if (!model) {
        throw new Error('Model Not found');
      }

      // update (specific properties only)
      [
        'name',
        'description',
      ].forEach(prop =>
        params[prop] !== undefined && (model[prop] = params[prop]),
      );

      models.update(model);

      return model;
    },
  },
  {
    url: 'dc-projects/([\\w\\-]+)/session$',
    method: 'GET',
    handler: function (this, params: IDCProjectSessionCreate & {1: TObjectId}, user) {
      const id = params[1];
      const dcProjects = this.collections.dcProjects;
      const dcProject = dcProjects.findOne({id: id, ownerId: user.id});

      if (!dcProject) {
        throw new Error('Project Not found');
      }

      throw new Error('Can\'t find a session');
    },
  },
  {
    url: 'dc-projects/([\\w\\-]+)/session$',
    method: 'POST',
    handler: function (this, params: IDCProjectSessionCreate & {1: TObjectId}, user) {
      const id = params[1];
      const dcProjects = this.collections.dcProjects;
      const dcProject = dcProjects.findOne({id: id, ownerId: user.id});

      if (!dcProject) {
        throw new Error('Project Not found');
      }

      throw new Error('Can\'t run a session');
    },
  },
  {
    url: 'dc-projects/([\\w\\-]+)/session$',
    method: 'DELETE',
    handler: function (this, params: IDCProjectSessionCreate & {1: TObjectId}, user) {
      const id = params[1];
      const dcProjects = this.collections.dcProjects;
      const dcProject = dcProjects.findOne({id: id, ownerId: user.id});

      if (!dcProject) {
        throw new Error('Project Not found');
      }

      throw new Error('Session not found');
    },
  },
  {
    url: 'dc-projects/([\\w\\-]+)$',
    method: 'DELETE',
    handler: function (this, params, user) {
      const id = params[1];
      const models = this.collections.dcProjects;
      const model = models.findOne({id: id, ownerId: user.id});
      if (!model) {
        throw new Error('Model Not found');
      }

      models.remove(model);

      return model;
    },
  },
  {
    url: 'dc-projects/([\\w\\-]+)/build$',
    method: 'POST',
    handler: function (this, params, user) {
      const id = params[1];
      const models = this.collections.dcProjects;
      const model = models.findOne({ id: id, ownerId: user.id });
      if (!model) {
        throw new Error('Model Not found');
      }

      const processes = this.collections.processes;
      const process = processes.findOne({ targetId: model.id, target: IAsset.Type.DC_PROJECT });

      if (process) {
        if (process.status === IProcess.Status.RUNNING) {
          throw new Error('A build process is already running for this project');
        }
        processes.remove(process);
      }

      const dcProjectProcess: IProcess = {
        id: 'dc_' + Date.now().toString(),
        ownerId: user.id,
        target: IAsset.Type.DC_PROJECT,
        targetId: model.id,
        progress: 0,
        status: IProcess.Status.RUNNING,
        created: new Date().toISOString(),
        started: new Date().toISOString(),
        jobType: IProcess.JobType.PROJECT_BUILD,
      };

      processes.insertOne(dcProjectProcess);

      // update packageName only when it's provided (locked)
      if (params['name']) {
        model.packageName = params['name'];
      }
      model.status = IDCProject.Status.BUILDING;
      models.update(model);
      const dcProjectPackage: IPackage = {
        id: Date.now().toString(),
        name: model.packageName || params['name'],
        created: Date.now().toString(),
        ownerId: user.id,
        version: params['version'],
        location: '/some/location/',
        dcProjectId: model.id,
        isPublished: false,
      };

      if (params['description']) {
        dcProjectPackage.description = params['description'];
      }

      this.collections.packages.insertOne(dcProjectPackage);

      return model;
    },
  },
]);
